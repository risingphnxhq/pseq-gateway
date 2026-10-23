(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory();else root.PBSDiagnostic=factory();})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
const DOMAINS=[
  {
    "id": "direction",
    "name": "Direction & decisions",
    "why": "A clear goal helps you choose what to do and what to stop.",
    "questions": [
      {
        "id": "goal",
        "prompt": "How clear is your next 90-day business goal?",
        "choices": [
          "No defined goal",
          "A broad ambition, without a measure",
          "A written goal with a measure and deadline",
          "A measured goal reviewed regularly, with trade-offs recorded"
        ],
        "proof": "Dated goal and review notes",
        "action": "Choose one measurable 90-day outcome. Record the baseline, target, deadline, owner and activities you will stop.",
        "metric": "One agreed outcome with a baseline, target and weekly review"
      },
      {
        "id": "priorities",
        "prompt": "How do you decide what gets resources?",
        "choices": [
          "React to the latest request",
          "Informal priorities change frequently",
          "Ranked priorities have an owner and capacity estimate",
          "Review priorities against results and stop low-value work"
        ],
        "proof": "Priority list and capacity review",
        "action": "Rank your initiatives by customer value, risk, effort and dependencies. Limit active work to available capacity.",
        "metric": "Active priorities versus capacity; decisions to stop or defer"
      },
      {
        "id": "decisions",
        "prompt": "How are important decisions followed through?",
        "choices": [
          "No record or clear decision-maker",
          "Decisions are remembered informally",
          "Decision, owner and follow-up date are recorded",
          "Review outcomes and adjust the decision process"
        ],
        "proof": "Decision log with outcomes",
        "action": "Create a decision log with rationale, assumptions, owner, review date and observed outcome.",
        "metric": "Decisions reviewed by their agreed date"
      }
    ]
  },
  {
    "id": "customers",
    "name": "Customers & offer",
    "why": "Demand needs evidence; optimism alone cannot establish product-market fit.",
    "questions": [
      {
        "id": "demand",
        "prompt": "What supports your belief that customers need this offer?",
        "choices": [
          "Assumptions without customer conversations",
          "Some conversations or anecdotal interest",
          "Documented interviews or tests with a defined customer group",
          "Repeated purchase or pilot evidence, with reasons for wins and losses"
        ],
        "proof": "Interview notes, test results or purchase records",
        "action": "Test the most important demand assumption with a defined customer group. Record objections as well as interest.",
        "metric": "Qualified conversations, pilot commitments or repeat purchases"
      },
      {
        "id": "value",
        "prompt": "How clearly is your offer defined?",
        "choices": [
          "Customer, problem and deliverable are unclear",
          "Offer described but scope or differentiation is vague",
          "Target customer, outcome, scope and price logic are documented",
          "Customers understand the offer; feedback informs revisions"
        ],
        "proof": "Offer brief and customer feedback",
        "action": "Write a one-page offer: customer, problem, deliverables, exclusions, price rationale and reason to choose it.",
        "metric": "Customers can explain the offer and its boundaries"
      },
      {
        "id": "feedback",
        "prompt": "How do customer results inform improvements?",
        "choices": [
          "No feedback process",
          "Occasional informal feedback",
          "Collect feedback or pilot feedback at planned points",
          "Review recurring themes and verify whether changes helped"
        ],
        "proof": "Feedback log and follow-up measures",
        "action": "Ask customers or pilot participants where delivery fell short. Select one recurring issue and retest after a change.",
        "metric": "Issue recurrence and customer-reported usefulness"
      }
    ]
  },
  {
    "id": "cash",
    "name": "Cash & economics",
    "why": "Cash timing and viable economics determine what the business can sustain.",
    "questions": [
      {
        "id": "cashview",
        "prompt": "How well can you see upcoming cash commitments?",
        "choices": [
          "No current view of cash and obligations",
          "Rough estimate with gaps",
          "Updated cash forecast and obligations list",
          "Review forecast versus actuals and stress-test shortfalls"
        ],
        "proof": "Cash forecast; use totals, not account details",
        "action": "Build a rolling 13-week cash forecast including expected receipts, commitments and downside assumptions. Review with a qualified accountant if needed.",
        "metric": "Forecast variance and upcoming unfunded commitments"
      },
      {
        "id": "economics",
        "prompt": "How well do you understand the economics of your offer?",
        "choices": [
          "Costs and price relationship unknown",
          "Some costs estimated; major costs missing",
          "Direct costs, delivery effort and margin assumptions documented",
          "Compare actual delivery costs and margins with assumptions"
        ],
        "proof": "Unit-economics worksheet and cost records",
        "action": "Estimate direct cost, support effort and contribution per sale. Test the assumptions before increasing sales volume.",
        "metric": "Contribution per sale and delivery effort variance"
      },
      {
        "id": "collections",
        "prompt": "How controlled are billing and financial records?",
        "choices": [
          "No reliable billing or expense records",
          "Records exist but are late or incomplete",
          "Regular reconciliations and clear payment/collection terms",
          "Reconcile on time, review exceptions and improve collection"
        ],
        "proof": "Reconciliation checklist and aged receivables summary",
        "action": "Reconcile business records, define payment terms and follow up aged receivables. Separate company and personal records.",
        "metric": "Reconciliation completion and overdue receivables"
      }
    ]
  },
  {
    "id": "delivery",
    "name": "Delivery & quality",
    "why": "A business promise is valuable only if it can be fulfilled consistently.",
    "questions": [
      {
        "id": "promise",
        "prompt": "How well defined is the customer delivery promise?",
        "choices": [
          "No defined scope or completion standard",
          "Scope described but completion is subjective",
          "Deliverables, turnaround and standards for finished work documented",
          "Actual delivery is checked against those criteria and improved"
        ],
        "proof": "Service specification, pilot acceptance or completed orders",
        "action": "Define what the customer receives, timing, exclusions and observable standards for finished work. Test one complete delivery.",
        "metric": "Deliveries meeting agreed acceptance and timing"
      },
      {
        "id": "workflow",
        "prompt": "How repeatable is your delivery workflow?",
        "choices": [
          "Depends on improvisation",
          "Steps known by one person",
          "Key steps, handoffs and checks are documented",
          "Track failure points and use results to improve the workflow"
        ],
        "proof": "Workflow map and completed checklist",
        "action": "Map the path from order to customer receipt. Identify each owner, check and recovery step.",
        "metric": "Handoff failures, rework and delivery lead time"
      },
      {
        "id": "capacity",
        "prompt": "How do you know how much work you can safely accept?",
        "choices": [
          "No capacity estimate",
          "Capacity judged informally",
          "Estimate workload, skill availability and bottlenecks",
          "Test capacity assumptions and adjust limits using actuals"
        ],
        "proof": "Capacity plan and turnaround history",
        "action": "Estimate sustainable weekly throughput. Set an intake limit and a response when demand exceeds capacity.",
        "metric": "Backlog age, workload and on-time delivery"
      }
    ]
  },
  {
    "id": "people",
    "name": "People & accountability",
    "why": "Solo businesses also need clear responsibilities and backup arrangements.",
    "questions": [
      {
        "id": "ownership",
        "prompt": "How clear is responsibility for important work?",
        "choices": [
          "No clear ownership",
          "Responsibilities understood informally",
          "Each key activity has an accountable owner, including a solo owner",
          "Owners review results and resolve gaps across handoffs"
        ],
        "proof": "Responsibility map and review notes",
        "action": "Assign one accountable owner to each important activity. Make handoff expectations explicit.",
        "metric": "Critical activities with an owner and a review date"
      },
      {
        "id": "skills",
        "prompt": "How do you address capability gaps?",
        "choices": [
          "Needed skills have not been identified",
          "Gaps recognized without a plan",
          "Assess gaps and arrange training, support or contractors",
          "Verify capability through completed work and review quality"
        ],
        "proof": "Capability plan and work samples",
        "action": "Identify the skill most likely to block delivery. Decide whether to learn, simplify, partner or contract.",
        "metric": "Capability demonstrated against a defined work sample"
      },
      {
        "id": "dependency",
        "prompt": "What happens if a key person is unavailable?",
        "choices": [
          "Important work stops without a fallback",
          "Some knowledge shared, but fallback untested",
          "Backup instructions or alternative support are arranged",
          "Test handover and update the fallback after the test"
        ],
        "proof": "Handover checklist or continuity exercise",
        "action": "Document the most dependent activity and test whether someone else or a fallback process can continue it.",
        "metric": "Critical activities with a tested fallback"
      }
    ]
  },
  {
    "id": "measurement",
    "name": "Measurement & learning",
    "why": "Measures should reveal decisions and results, not reward activity for its own sake.",
    "questions": [
      {
        "id": "metrics",
        "prompt": "How do you measure whether the business is progressing?",
        "choices": [
          "No defined measures",
          "Track activity without a clear link to outcomes",
          "A small set of outcome measures has baselines and targets",
          "Use trends and segmented results to make decisions"
        ],
        "proof": "Scorecard with definitions and dated results",
        "action": "Choose three to five useful outcome measures. Define calculation, baseline, target and review frequency.",
        "metric": "Measures with consistent definitions and review actions"
      },
      {
        "id": "records",
        "prompt": "How dependable are the records behind decisions?",
        "choices": [
          "Important records are missing",
          "Records scattered or inconsistent",
          "Key records have a reliable source and regular checks",
          "Check errors, access and consistency; resolve discrepancies"
        ],
        "proof": "Record inventory and quality checks",
        "action": "Identify a source of truth for customers, orders and results. Reconcile discrepancies before using totals.",
        "metric": "Unresolved discrepancies and record completeness"
      },
      {
        "id": "learning",
        "prompt": "How do you find out whether improvements worked?",
        "choices": [
          "Changes made without follow-up",
          "Discuss impressions after changes",
          "Record hypothesis, baseline, change and review date",
          "Compare results, note other influences and retain useful lessons"
        ],
        "proof": "Experiment log and before/after results",
        "action": "Run one small improvement test. State the expected effect and compare results without assuming causation.",
        "metric": "Tests reviewed with results and next decisions"
      }
    ]
  },
  {
    "id": "controls",
    "name": "Controls & obligations",
    "why": "Business controls need qualified review where relevant; a questionnaire cannot certify compliance.",
    "questions": [
      {
        "id": "obligations",
        "prompt": "How do you manage obligations relevant to your activity?",
        "choices": [
          "Applicable obligations not identified",
          "Some obligations known; gaps or deadlines unclear",
          "Maintain an obligations list with owners and qualified advice where needed",
          "Review changes and retain evidence of checks and timely completion"
        ],
        "proof": "Obligations register and advisor review date",
        "action": "List applicable contracts, licensing, tax, employment, privacy and sector obligations. Confirm uncertain items with a qualified professional.",
        "metric": "Obligations with an owner, deadline and review evidence"
      },
      {
        "id": "access",
        "prompt": "How are important systems and customer information protected?",
        "choices": [
          "Shared access or no recovery plan",
          "Some protections but inconsistent access control",
          "Use appropriate access limits, multifactor authentication and backups",
          "Review access and test recovery; address findings"
        ],
        "proof": "Access review and restore-test record; no credentials",
        "action": "Review who can access important information, enable appropriate authentication and test recovery without sharing credentials.",
        "metric": "Access reviewed and recovery tested"
      },
      {
        "id": "contracts",
        "prompt": "How clear are customer and supplier commitments?",
        "choices": [
          "Important terms unclear or absent",
          "Terms exist but do not match actual delivery",
          "Scope, payment, responsibilities and dispute paths are clear",
          "Review disputes and changes; obtain qualified advice for material terms"
        ],
        "proof": "Contract checklist and scope comparison",
        "action": "Compare promises, delivery and terms. Clarify responsibilities, cancellations and escalation before taking new commitments.",
        "metric": "Material commitments with clear scope and escalation"
      }
    ]
  },
  {
    "id": "resilience",
    "name": "Resilience & next-stage fit",
    "why": "Expansion should respect concentration, capacity and downside risks.",
    "questions": [
      {
        "id": "concentration",
        "prompt": "How well do you understand dependence on one source?",
        "choices": [
          "Dependencies not assessed",
          "Known reliance on one customer, supplier or channel without a plan",
          "Assess major dependencies and prepare alternatives",
          "Test alternatives and review concentration against chosen limits"
        ],
        "proof": "Dependency map and alternative test",
        "action": "Map reliance on customers, suppliers, platforms and technology. Test one practical alternative.",
        "metric": "Largest dependencies and alternatives tested"
      },
      {
        "id": "disruption",
        "prompt": "How prepared are you for a serious interruption?",
        "choices": [
          "No response plan",
          "Informal response ideas",
          "Prioritized continuity plan with contact and recovery steps",
          "Practice recovery and address weaknesses found"
        ],
        "proof": "Continuity plan and exercise record",
        "action": "Plan for the most plausible interruption: cash delay, outage, key-person absence or supplier failure. Test recovery.",
        "metric": "Recovery time and unresolved exercise findings"
      },
      {
        "id": "expansion",
        "prompt": "How do you decide when to expand?",
        "choices": [
          "Expand based on optimism alone",
          "Some signals considered without explicit criteria",
          "Use demand, economics, capacity and risk criteria",
          "Test expansion in stages and stop or adjust against results"
        ],
        "proof": "Expansion decision criteria or launch/pilot plan",
        "action": "Write go/no-go criteria for the next commitment. Test a smaller step before adding fixed costs.",
        "metric": "Expansion criteria met and downside exposure reviewed"
      }
    ]
  }
];
const VERSION='PBS-DIAGNOSTIC-2.0.0';
const RISKS=[
{id:'cash_due',label:'Do you expect to be unable to meet committed payments falling due in the next 30 days?',action:'Review due commitments and a downside cash forecast today. Speak with a qualified accountant or appropriate advisor before adding commitments.'},
{id:'delivery_failure',label:'Are there current customer commitments that you know you cannot fulfill as promised?',action:'Identify affected commitments, contact the responsible delivery owner and prepare an honest recovery or cancellation proposal.'},
{id:'active_harm',label:'Is there an unresolved incident causing ongoing harm, such as unsafe delivery or exposed customer information?',action:'Prioritize containment and the appropriate qualified incident or safety specialist. Follow applicable reporting obligations with professional advice.'},
{id:'obligation_breach',label:'Has a qualified advisor or responsible authority identified a material obligation breach that remains unresolved?',action:'Contact the responsible qualified advisor, clarify deadlines and record the corrective action. Avoid treating this assessment as a legal determination.'}
];
function questions(mode){return DOMAINS.flatMap(d=>(mode==='quick'?d.questions.slice(0,1):d.questions).map(q=>({...q,domain:d.id})));}
function evaluate(input){
 if(!input||!['quick','full'].includes(input.mode)||!['prelaunch','operating','expanding'].includes(input.stage))throw Error('Choose an assessment and business stage.');
 const qs=questions(input.mode),answers=input.answers||{},risks=input.risks||{};
 for(const q of qs){const a=answers[q.id];if(a!==undefined&&a!==null&&(!Number.isInteger(a)||a<0||a>3))throw Error('Invalid answer: '+q.id);}
 for(const r of RISKS){if(risks[r.id]!==undefined&&!['yes','no','unknown'].includes(risks[r.id]))throw Error('Invalid risk answer.');}
 const answered=qs.filter(q=>Number.isInteger(answers[q.id])),coverage=answered.length/qs.length;
 const knownRisks=RISKS.filter(r=>['yes','no'].includes(risks[r.id])),urgent=RISKS.filter(r=>risks[r.id]==='yes');
 const areas=DOMAINS.map(d=>{const relevant=qs.filter(q=>q.domain===d.id),known=relevant.filter(q=>Number.isInteger(answers[q.id]));const score=known.length?100*known.reduce((s,q)=>s+answers[q.id],0)/(3*known.length):null;const complete=known.length===relevant.length;return {id:d.id,name:d.name,why:d.why,score:score===null?null:Math.round(score),coverage:known.length/relevant.length,status:score===null?'UNKNOWN':score<45?'RED':(!complete||score<75)?'YELLOW':'GREEN',questions:relevant.map(q=>({...q,answer:answers[q.id]??null,reference:String(input.references?.[q.id]||'').trim().slice(0,240)}))};});
 const score=areas.every(a=>a.score!==null)?Math.round(areas.reduce((s,a)=>s+a.score,0)/areas.length):null;
 let status='YELLOW',reason='Some practices or information gaps need attention before the next commitment.';
 if(urgent.length){status='RED';reason='A current risk you reported takes priority over the average score.';}
 else if(areas.some(a=>a.status==='RED')){status='RED';reason='At least one assessed business area needs prompt corrective attention.';}
 else if(!answered.length){status='UNKNOWN';reason='No practice answers yet. There is not enough information to assess your position.';}
 else if(coverage===1&&knownRisks.length===RISKS.length&&areas.every(a=>a.status==='GREEN')){status='GREEN';reason='Your practices you report appear supportive of the next step. Confirm important assumptions before committing.';}
 const referenceCount=answered.filter(q=>String(input.references?.[q.id]||'').trim()).length;
 const weaknesses=areas.flatMap(a=>a.questions.filter(q=>q.answer!==null&&q.answer<3).map(q=>({...q,area:a.name,severity:3-q.answer}))).sort((a,b)=>b.severity-a.severity||a.id.localeCompare(b.id));
 const strengths=areas.flatMap(a=>a.questions.filter(q=>q.answer===3).map(q=>({area:a.name,prompt:q.prompt,basis:q.choices[3]})));
 const gaps=qs.filter(q=>!Number.isInteger(answers[q.id])).map(q=>({id:q.id,prompt:q.prompt,proof:q.proof}));
 const plan=weaknesses.slice(0,3).map((q,i)=>({horizon:['First 30 days','Days 31–60','Days 61–90'][i],area:q.area,finding:'You selected: '+q.choices[q.answer],hypothesis:'This may limit '+DOMAINS.find(d=>d.id===q.domain).name.toLowerCase()+'. Confirm with the suggested record before assuming a cause.',action:q.action,measure:q.metric,evidence:q.proof,owner:'Choose an accountable business owner',review:'Set a review date after establishing a baseline'}));
 const tensions=[];if(risks.cash_due==='yes'&&answers.cashview===3)tensions.push('You report a tested cash forecast and an expected payment shortfall. A reliable forecast can reveal a real shortfall; prioritize the shortfall rather than treating the forecast as a solution.');
 if(risks.delivery_failure==='yes'&&answers.promise===3)tensions.push('You report strong delivery checks and commitments you cannot fulfill. Investigate the affected commitments; do not infer that documented checks mean delivery succeeded.');
 return {version:VERSION,mode:input.mode,stage:input.stage,business:String(input.business||'Your business').trim().slice(0,120),goal:String(input.goal||'').trim().slice(0,600),generated_at:new Date().toISOString(),status,reason,score,coverage:Math.round(coverage*100),risk_coverage:Math.round(knownRisks.length/RISKS.length*100),risk_answers:Object.fromEntries(RISKS.map(r=>[r.id,risks[r.id]||'unknown'])),references:referenceCount,independent_verifications:0,areas,urgent,gaps,tensions,strengths,plan,limits:'PBS scoring rules use your own answers. This is not a credit score, certification, comparison with other businesses, verified financial review or professional opinion. The scoring cutoffs have not been proven to predict results. Records you named have not been reviewed.'};
}
return {VERSION,DOMAINS,RISKS,questions,evaluate};
});

