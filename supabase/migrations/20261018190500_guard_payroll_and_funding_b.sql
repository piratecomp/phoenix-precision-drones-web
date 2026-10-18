CREATE OR REPLACE FUNCTION public.ppd_funding_prepare_package(p_opportunity_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'extensions', 'pg_temp'
AS $function$
declare
  o record;
  p record;
  v_application_id uuid;
  v_body text;
begin
  IF NOT (public.portal_current_user_has_role('owner') OR public.portal_current_user_has_role('admin')) THEN
    RAISE EXCEPTION 'PPD funding access denied' USING ERRCODE='42501';
  END IF;
  select * into o from public.funding_opportunities where id = p_opportunity_id;
  if o.id is null then
    return jsonb_build_object('ok', false, 'error', 'opportunity_not_found');
  end if;

  if coalesce(o.accuracy_status,'unverified') in ('rejected_noise','duplicate_hidden') or coalesce(o.status,'review') in ('rejected','duplicate_hidden') then
    return jsonb_build_object('ok', false, 'error', 'opportunity_failed_accuracy_filter', 'accuracy_status', o.accuracy_status, 'status', o.status);
  end if;

  select * into p from public."funding_company_profile" order by updated_at desc nulls last limit 1;

  select id into v_application_id
  from public.funding_applications
  where opportunity_id = o.id
  order by created_at desc
  limit 1;

  if v_application_id is null then
    insert into public.funding_applications (opportunity_id, application_status, assigned_owner, notes, metadata, created_at, updated_at)
    values (o.id, 'package_ready', 'owner', 'Funding AI prepared a draft package for owner review.', jsonb_build_object('source','ppd_funding_prepare_package'), now(), now())
    returning id into v_application_id;
  else
    update public.funding_applications
    set application_status = case when application_status in ('owner_go_approved','submitted') then application_status else 'package_ready' end,
        updated_at = now()
    where id = v_application_id;
  end if;

  v_body := '<h2>Funding Package</h2>' ||
            '<p><b>Opportunity:</b> ' || coalesce(o.title, o.opportunity_name, 'Untitled') || '</p>' ||
            '<p><b>Source:</b> ' || coalesce(o.source_name, o.source_type, 'Unknown') || '</p>' ||
            '<p><b>Link:</b> ' || coalesce(o.application_url, o.submission_url, o.source_url, o.url, 'Not found') || '</p>' ||
            '<h3>Company Overview</h3><p>' || coalesce(p.business_summary, 'Phoenix Precision Drones provides commercial drone services and aerial data support.') || '</p>' ||
            '<h3>Founder Background</h3><p>' || coalesce(p.founder_background, 'Field operations and construction leadership background.') || '</p>' ||
            '<h3>Services</h3><p>' || coalesce(p.services_summary, 'Mapping, inspections, media, thermal, LiDAR, and pilot network services.') || '</p>' ||
            '<h3>Use of Funds</h3><p>' || coalesce(p.use_of_funds, 'Equipment, compliance, insurance, software, marketing, and launch operations.') || '</p>' ||
            '<h3>Owner Checklist</h3><ul><li>Confirm eligibility.</li><li>Confirm company details.</li><li>Review draft answers.</li><li>Approve only when ready.</li></ul>';

  insert into public.funding_documents (opportunity_id, application_id, document_type, title, body, status, owner_action_required, created_by, metadata, created_at, updated_at)
  select o.id, v_application_id, 'application_package', 'Application Package - ' || coalesce(o.title, o.opportunity_name, 'Untitled'), v_body, 'draft', true, 'funding_ai', jsonb_build_object('source','ppd_funding_prepare_package'), now(), now()
  where not exists (select 1 from public.funding_documents where opportunity_id = o.id and document_type = 'application_package');

  update public.funding_opportunities set package_status='package_ready', owner_go_enabled=true, go_status='ready_for_owner', updated_at=now() where id=o.id;

  return jsonb_build_object('ok', true, 'opportunity_id', o.id, 'application_id', v_application_id, 'status', 'package_ready');
end;
$function$;

CREATE OR REPLACE FUNCTION public.ppd_generate_payroll_draft_batch(p_payroll_period_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'extensions', 'pg_temp'
AS $function$
declare
  v_preflight jsonb;
  v_employee jsonb;
  v_contract jsonb;
  v_batch_id uuid;
  v_blockers integer;
  v_gross numeric;
  v_net numeric;
  v_tax numeric;
  v_contract_total numeric;
  v_items integer := 0;
  r record;
begin
  IF NOT (public.portal_current_user_has_role('owner') OR public.portal_current_user_has_role('admin') OR public.portal_current_user_has_role('finance_payroll')) THEN
    RAISE EXCEPTION 'PPD payroll access denied' USING ERRCODE='42501';
  END IF;
  v_preflight := public.ppd_run_payroll_preflight(p_payroll_period_id);
  v_blockers := coalesce((v_preflight->>'blockers')::integer,0);

  v_employee := public.ppd_generate_employee_payroll_draft(p_payroll_period_id);
  v_contract := public.ppd_generate_contractor_payout_draft(p_payroll_period_id);

  delete from public.payroll_payment_batches
  where payroll_period_id = p_payroll_period_id
    and batch_status = 'draft';

  insert into public.payroll_payment_batches (
    payroll_period_id, batch_type, batch_status, gross_total, net_total, tax_total, contractor_total, item_count, metadata, created_at, updated_at
  ) values (
    p_payroll_period_id, 'mixed', case when v_blockers = 0 then 'draft_ready_for_review' else 'draft_blocked' end,
    0, 0, 0, 0, 0,
    jsonb_build_object('preflight', v_preflight, 'employee_draft', v_employee, 'contractor_draft', v_contract, 'no_money_movement', true),
    now(), now()
  ) returning id into v_batch_id;

  for r in
    select pe.id as payroll_entry_id, pe.worker_profile_id, pe.gross_pay, pe.tax_withheld, pe.net_pay
    from public.payroll_entries pe
    where pe.payroll_period_id = p_payroll_period_id
      and coalesce(pe.draft_status,'draft') = 'draft'
  loop
    insert into public.payroll_payment_items (
      payment_batch_id, worker_profile_id, payroll_entry_id, item_type, gross_amount, tax_amount, net_amount, payment_status, hold_reason, metadata, created_at, updated_at
    ) values (
      v_batch_id, r.worker_profile_id, r.payroll_entry_id, 'w2_employee_draft', coalesce(r.gross_pay,0), coalesce(r.tax_withheld,0), coalesce(r.net_pay,0),
      'hold', 'Employee payroll draft requires verified tax engine and payroll preflight approval.', jsonb_build_object('source','payroll_entries'), now(), now()
    );
    v_items := v_items + 1;
  end loop;

  for r in
    select pp.id as pilot_payout_id, pp.worker_profile_id, pp.amount, pp.net_amount, pp.status, pp.payout_hold_reason
    from public.pilot_payouts pp
    where pp.payroll_period_id = p_payroll_period_id
      and pp.status in ('draft','draft_hold','pending')
  loop
    insert into public.payroll_payment_items (
      payment_batch_id, worker_profile_id, pilot_payout_id, item_type, gross_amount, tax_amount, net_amount, payment_status, hold_reason, metadata, created_at, updated_at
    ) values (
      v_batch_id, r.worker_profile_id, r.pilot_payout_id, 'contract_pilot_draft', coalesce(r.amount,0), 0, coalesce(r.net_amount,r.amount,0),
      case when r.status='draft' and v_blockers=0 then 'draft' else 'hold' end,
      case when r.status='draft' and v_blockers=0 then null else coalesce(r.payout_hold_reason,'Payroll preflight blocked.') end,
      jsonb_build_object('source','pilot_payouts'), now(), now()
    );
    v_items := v_items + 1;
  end loop;

  select coalesce(sum(gross_amount),0), coalesce(sum(net_amount),0), coalesce(sum(tax_amount),0),
         coalesce(sum(case when item_type='contract_pilot_draft' then net_amount else 0 end),0)
  into v_gross, v_net, v_tax, v_contract_total
  from public.payroll_payment_items
  where payment_batch_id = v_batch_id;

  update public.payroll_payment_batches
  set gross_total = v_gross,
      net_total = v_net,
      tax_total = v_tax,
      contractor_total = v_contract_total,
      item_count = v_items,
      updated_at = now()
  where id = v_batch_id;

  perform public.ppd_sync_payroll_finance_control_items(p_payroll_period_id);

  return jsonb_build_object(
    'ok', true,
    'payroll_period_id', p_payroll_period_id,
    'payment_batch_id', v_batch_id,
    'batch_status', case when v_blockers = 0 then 'draft_ready_for_review' else 'draft_blocked' end,
    'items', v_items,
    'employee_draft', v_employee,
    'contractor_draft', v_contract,
    'preflight', v_preflight,
    'no_money_movement', true
  );
end;
$function$;

CREATE OR REPLACE FUNCTION public.ppd_get_funding_opportunity_explanation(p_opportunity_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'extensions', 'pg_temp'
AS $function$
declare
  o record;
  p record;
  v_documents jsonb := '[]'::jsonb;
  v_rules jsonb;
  v_fit jsonb;
  v_gaps jsonb;
  v_next_step text;
begin
  IF NOT (public.portal_current_user_has_role('owner') OR public.portal_current_user_has_role('admin')) THEN
    RAISE EXCEPTION 'PPD funding access denied' USING ERRCODE='42501';
  END IF;
  perform public.ppd_classify_funding_fit(p_opportunity_id);

  select * into o from public.funding_opportunities where id = p_opportunity_id;
  if o.id is null then
    return jsonb_build_object('ok', false, 'error', 'opportunity_not_found');
  end if;

  select * into p from public."funding_company_profile" order by updated_at desc nulls last limit 1;

  select coalesce(jsonb_agg(row_to_json(d)::jsonb order by d.updated_at desc), '[]'::jsonb)
  into v_documents
  from (
    select id, document_type, title, status, owner_action_required, updated_at
    from public.funding_documents
    where opportunity_id = o.id
    order by updated_at desc
    limit 8
  ) d;

  v_rules := jsonb_build_object(
    'source', coalesce(o.source_name, o.source_type, 'Unknown source'),
    'opportunity_type', coalesce(o.opportunity_type, o.classification, o.source_type, 'funding_opportunity'),
    'deadline', coalesce(o.deadline_date::text, o.deadline_text, 'Monitor'),
    'estimated_value', coalesce(o.funding_amount_max, o.estimated_funding_max, o.expected_award_max, o.detected_amount, 0),
    'eligibility_summary', coalesce(o.eligibility_summary, 'Eligibility needs review from the source page before submission.'),
    'application_summary', coalesce(o.application_summary, 'Application instructions need review from the source page before submission.'),
    'required_documents', coalesce(o.required_documents, '[]'::jsonb),
    'application_requirements', coalesce(o.application_requirements, '[]'::jsonb),
    'application_questions', coalesce(o.application_questions, '[]'::jsonb),
    'application_steps', coalesce(o.application_steps, '[]'::jsonb),
    'submission_method', coalesce(o.submission_method, 'owner_portal_review'),
    'application_url', coalesce(o.application_url, o.submission_url, o.source_url, o.url)
  );

  v_fit := jsonb_build_object(
    'company', coalesce(p.company_name, 'Phoenix Precision Drones'),
    'business_stage', coalesce(p.business_stage, p.launch_stage, 'startup'),
    'location', coalesce(p.location, 'Phoenix, Arizona'),
    'industry_fit', 'Commercial drone services, mapping, inspection, infrastructure documentation, and AI-supported operations are aligned with technology, infrastructure, public safety, and small business funding programs when the opportunity specifically requests those capabilities.',
    'founder_fit', coalesce(p.founder_background, 'Founder has construction field operations, safety, scheduling, inspection, and jobsite management experience.'),
    'services_fit', coalesce(p.services_summary, 'PPD services include construction mapping, inspections, real estate media, thermal/LiDAR mapping, and pilot network services.'),
    'use_of_funds_fit', coalesce(p.use_of_funds, 'Funding would support commercial drone equipment, compliance, insurance, software/backend tools, marketing, pilot recruiting, and launch operations.'),
    'impact_fit', coalesce(p.community_impact, 'PPD can support safer inspections, better jobsite documentation, small business growth, and opportunities for drone pilots.'),
    'fit_status', coalesce(o.fit_status,'needs_review'),
    'fit_score', coalesce(o.fit_score,0),
    'fit_reason', coalesce(o.fit_reason,'No fit review completed yet.'),
    'applyability_status', coalesce(o.applyability_status,'needs_review'),
    'applyability_reason', coalesce(o.applyability_reason,'Needs review.'),
    'system_score', coalesce(o.score,0),
    'win_probability', coalesce(o.confidence_score,0)
  );

  v_gaps := jsonb_build_array();

  if coalesce(o.application_url, o.submission_url, o.source_url, o.url) is null then
    v_gaps := v_gaps || jsonb_build_array('Missing direct application/source URL. Funding AI needs a verified source link before owner Go submission.');
  end if;

  if coalesce(o.deadline_date::text, o.deadline_text) is null then
    v_gaps := v_gaps || jsonb_build_array('Deadline is not confirmed. Treat as monitor/research until source page confirms it.');
  end if;

  if coalesce(o.required_documents, '[]'::jsonb) = '[]'::jsonb then
    v_gaps := v_gaps || jsonb_build_array('Required documents were not extracted yet. Owner or extractor should review source requirements.');
  end if;

  if coalesce(o.application_questions, '[]'::jsonb) = '[]'::jsonb then
    v_gaps := v_gaps || jsonb_build_array('Application questions were not extracted yet. Draft package may need manual completion after source review.');
  end if;

  if coalesce(o.fit_score,0) < 0.65 then
    v_gaps := v_gaps || jsonb_build_array('Fit score is below Go threshold. Confirm PPD relevance before preparing or submitting.');
  end if;

  if coalesce(o.score,0) < 75 then
    v_gaps := v_gaps || jsonb_build_array('Overall score is below automatic owner-Go threshold. This needs manual review.');
  end if;

  if o.owner_go_enabled is true then
    v_next_step := 'Review the application package and source rules, then click Go only if you agree with the fit and requirements.';
  elsif o.package_status = 'package_ready' then
    v_next_step := 'Package exists, but Go is held until fit/rules are verified. Review the explanation and source page.';
  else
    v_next_step := 'Prepare the application package only after confirming this is a real opportunity and PPD fits.';
  end if;

  return jsonb_build_object(
    'ok', true,
    'generated_at', now(),
    'opportunity', jsonb_build_object(
      'id', o.id,
      'title', coalesce(o.title, o.opportunity_name, 'Untitled opportunity'),
      'source_name', o.source_name,
      'source_type', o.source_type,
      'status', coalesce(o.status, o.opportunity_status),
      'package_status', o.package_status,
      'go_status', o.go_status,
      'owner_go_enabled', o.owner_go_enabled,
      'score', o.score,
      'confidence_score', o.confidence_score,
      'fit_status', o.fit_status,
      'fit_score', o.fit_score,
      'applyability_status', o.applyability_status
    ),
    'rules', v_rules,
    'fit', v_fit,
    'gaps', v_gaps,
    'documents', v_documents,
    'next_step', v_next_step
  );
end;
$function$;
