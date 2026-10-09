import React, { useState, useEffect } from 'react';
import { api } from '../api/client';
import { 
  Cloud, 
  Layers, 
  DollarSign, 
  ShieldCheck, 
  Network, 
  Cpu, 
  Database, 
  Server, 
  Activity, 
  CheckCircle2, 
  FileCode, 
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Sparkles,
  PieChart
} from 'lucide-react';

export default function AwsArchitecture() {
  const [modules, setModules] = useState([]);
  const [expandedModule, setExpandedModule] = useState(1);
  const [activeSubTab, setActiveSubTab] = useState('syllabus'); // syllabus, tco, well_architected, diagram

  // TCO Calculator State
  const [userCount, setUserCount] = useState(500);
  const [checkpointsPerDay, setCheckpointsPerDay] = useState(2500);
  const [retentionDays, setRetentionDays] = useState(90);
  const [multiAz, setMultiAz] = useState(true);
  const [tcoResult, setTcoResult] = useState(null);
  const [tcoLoading, setTcoLoading] = useState(false);

  // Well-Architected Review State
  const [waAnswers, setWaAnswers] = useState({
    sec_least_privilege: true,
    sec_encryption: true,
    rel_multi_az: true,
    rel_backup: true,
    perf_graviton: true,
    cost_lifecycle: true,
    ops_iac: true,
    sus_managed_services: true
  });
  const [waResult, setWaResult] = useState(null);

  useEffect(() => {
    const fetchSyllabus = async () => {
      try {
        const data = await api.getSyllabus();
        setModules(data);
      } catch (err) {
        console.error('Error fetching syllabus modules:', err);
      }
    };
    fetchSyllabus();
    runTcoCalc();
    runWaReview();
  }, []);

  const runTcoCalc = async () => {
    setTcoLoading(true);
    try {
      const res = await api.calculateTCO({
        user_count: userCount,
        checkpoints_per_day: checkpointsPerDay,
        average_checkpoint_kb: 25.0,
        retention_days: retentionDays,
        include_multi_az: multiAz,
        include_waf_cloudfront: true
      });
      setTcoResult(res);
    } catch (err) {
      console.error('Error calculating TCO:', err);
    } finally {
      setTcoLoading(false);
    }
  };

  const runWaReview = async (updatedAnswers = waAnswers) => {
    try {
      const res = await api.reviewWellArchitected({
        workload_name: 'Work Continuity Cloud Workload',
        answers: updatedAnswers
      });
      setWaResult(res);
    } catch (err) {
      console.error('Error running Well-Architected review:', err);
    }
  };

  const toggleWaQuestion = (key) => {
    const updated = { ...waAnswers, [key]: !waAnswers[key] };
    setWaAnswers(updated);
    runWaReview(updated);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-slate-900/90 border border-slate-800">
        <div>
          <div className="flex items-center space-x-2">
            <Cloud className="w-5 h-5 text-blue-400" />
            <h2 className="text-base font-bold text-white">AWS Cloud Architecture & Syllabus Mapping</h2>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Comprehensive production cloud implementation mapped to all 10 core Cloud Practitioner & Solutions Architect syllabus domains.
          </p>
        </div>

        {/* Sub-tabs */}
        <div className="flex items-center space-x-1.5 p-1 rounded-xl bg-slate-950 border border-slate-800 text-xs">
          {[
            { id: 'syllabus', label: '10 Syllabus Modules' },
            { id: 'diagram', label: 'Cloud Topology' },
            { id: 'tco', label: 'TCO & Billing' },
            { id: 'well_architected', label: 'Well-Architected' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveSubTab(tab.id)}
              className={`px-3 py-1.5 font-bold rounded-lg transition ${
                activeSubTab === tab.id
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* 1. Syllabus 10 Modules Explorer */}
      {activeSubTab === 'syllabus' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-3">
            {modules.map((m) => {
              const isExpanded = expandedModule === m.module_number;
              return (
                <div 
                  key={m.module_number}
                  className={`rounded-2xl border transition overflow-hidden ${
                    isExpanded 
                      ? 'bg-slate-900 border-blue-500/40 shadow-xl' 
                      : 'bg-slate-900/70 border-slate-800/90 hover:border-slate-700'
                  }`}
                >
                  <button
                    onClick={() => setExpandedModule(isExpanded ? null : m.module_number)}
                    className="w-full flex items-center justify-between p-4 text-left transition"
                  >
                    <div className="flex items-center space-x-3">
                      <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs ${
                        isExpanded ? 'bg-blue-600 text-white' : 'bg-slate-800 text-blue-400'
                      }`}>
                        M{m.module_number}
                      </div>
                      <div>
                        <h3 className="text-xs font-bold text-white">{m.title}</h3>
                        <p className="text-[11px] text-slate-400">{m.syllabus_topic}</p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-3 shrink-0">
                      <div className="hidden sm:flex items-center space-x-1.5">
                        {m.aws_services.map((svc, i) => (
                          <span key={i} className="px-2 py-0.5 text-[10px] rounded-md bg-slate-950 text-slate-300 border border-slate-800 font-mono">
                            {svc}
                          </span>
                        ))}
                      </div>
                      {isExpanded ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                    </div>
                  </button>

                  {isExpanded && (
                    <div className="p-5 pt-0 border-t border-slate-800/80 space-y-4 text-xs">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3">
                        <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 space-y-1">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">
                            Concrete Project Implementation Evidence
                          </span>
                          <p className="text-slate-200 leading-relaxed font-medium">
                            {m.project_evidence}
                          </p>
                        </div>

                        <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 space-y-1">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-blue-400">
                            Technical Architecture Details
                          </span>
                          <p className="text-slate-300 leading-relaxed">
                            {m.implementation_details}
                          </p>
                        </div>
                      </div>

                      {/* Architecture Artifacts / Sample Configuration */}
                      <div className="space-y-1.5">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center space-x-1">
                          <FileCode className="w-3.5 h-3.5" />
                          <span>Configured Cloud Artifacts & Parameters</span>
                        </span>
                        <pre className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-[11px] font-mono text-cyan-300 overflow-x-auto">
                          {JSON.stringify(m.sample_artifacts, null, 2)}
                        </pre>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 2. Interactive Cloud Topology Diagram */}
      {activeSubTab === 'diagram' && (
        <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200">
              High Availability AWS Production Architecture Topology
            </h3>
            <span className="text-[10px] font-mono text-emerald-400">Region: us-east-1 (Multi-AZ)</span>
          </div>

          {/* SVG Visual Diagram */}
          <div className="p-6 rounded-2xl bg-slate-950 border border-slate-800 flex flex-col items-center space-y-6">
            {/* Edge Layer */}
            <div className="w-full max-w-xl p-3 rounded-2xl bg-gradient-to-r from-blue-900/30 to-purple-900/30 border border-blue-500/40 text-center space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-blue-400">Edge Tier</span>
              <div className="text-xs font-bold text-white">Amazon CloudFront CDN + AWS WAF (DDoS Mitigation)</div>
            </div>

            <div className="w-0.5 h-6 bg-slate-700" />

            {/* Public VPC Subnets */}
            <div className="w-full max-w-2xl p-4 rounded-2xl bg-slate-900/90 border border-slate-700 space-y-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-400">
                Public Subnets (us-east-1a, us-east-1b) • CIDR 10.0.1.0/24
              </span>
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-center text-xs font-bold text-white">
                Application Load Balancer (ALB) + NAT Gateway
              </div>
            </div>

            <div className="w-0.5 h-6 bg-slate-700" />

            {/* Private Compute Subnets */}
            <div className="w-full max-w-2xl p-4 rounded-2xl bg-slate-900/90 border border-slate-700 space-y-3">
              <span className="text-[10px] font-bold uppercase tracking-wider text-purple-400">
                Private Application Subnets • CIDR 10.0.10.0/24 (No Public IPs)
              </span>
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-center text-xs">
                  <div className="font-bold text-white">EC2 Auto Scaling Group</div>
                  <div className="text-[10px] text-slate-400">FastAPI API Cluster (t4g.small ARM64)</div>
                </div>
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-center text-xs">
                  <div className="font-bold text-white">AWS Lambda Workers</div>
                  <div className="text-[10px] text-slate-400">Async Retention & NLP Briefing</div>
                </div>
              </div>
            </div>

            <div className="w-0.5 h-6 bg-slate-700" />

            {/* Data & Storage Layer */}
            <div className="w-full max-w-2xl p-4 rounded-2xl bg-slate-900/90 border border-slate-700 space-y-3">
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">
                Isolated Database & Storage Tier (Encrypted KMS AES-256)
              </span>
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-center text-xs">
                  <div className="font-bold text-white">Amazon RDS PostgreSQL</div>
                  <div className="text-[10px] text-slate-400">Multi-AZ Standby + Read Replicas</div>
                </div>
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-center text-xs">
                  <div className="font-bold text-white">Amazon S3 Tiered Storage</div>
                  <div className="text-[10px] text-slate-400">Standard ➔ Intelligent-Tiering ➔ Glacier</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 3. TCO & Cost Billing Calculator */}
      {activeSubTab === 'tco' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Controls */}
          <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200">
              Workload Parameters
            </h3>

            <div className="space-y-3 text-xs">
              <div>
                <div className="flex justify-between font-semibold text-slate-300 mb-1">
                  <span>Active Engineers</span>
                  <span className="text-blue-400 font-mono font-bold">{userCount}</span>
                </div>
                <input
                  type="range"
                  min="50"
                  max="10000"
                  step="50"
                  value={userCount}
                  onChange={(e) => {
                    setUserCount(Number(e.target.value));
                    runTcoCalc();
                  }}
                  className="w-full h-1.5 bg-slate-800 rounded accent-blue-500"
                />
              </div>

              <div>
                <div className="flex justify-between font-semibold text-slate-300 mb-1">
                  <span>Checkpoints Saved / Day</span>
                  <span className="text-indigo-400 font-mono font-bold">{checkpointsPerDay}</span>
                </div>
                <input
                  type="range"
                  min="100"
                  max="50000"
                  step="100"
                  value={checkpointsPerDay}
                  onChange={(e) => {
                    setCheckpointsPerDay(Number(e.target.value));
                    runTcoCalc();
                  }}
                  className="w-full h-1.5 bg-slate-800 rounded accent-indigo-500"
                />
              </div>

              <div>
                <div className="flex justify-between font-semibold text-slate-300 mb-1">
                  <span>Data Retention (Days)</span>
                  <span className="text-purple-400 font-mono font-bold">{retentionDays}d</span>
                </div>
                <input
                  type="range"
                  min="30"
                  max="365"
                  step="15"
                  value={retentionDays}
                  onChange={(e) => {
                    setRetentionDays(Number(e.target.value));
                    runTcoCalc();
                  }}
                  className="w-full h-1.5 bg-slate-800 rounded accent-purple-500"
                />
              </div>

              <div className="pt-2 flex items-center justify-between">
                <span className="font-semibold text-slate-300">Multi-AZ High Availability</span>
                <input
                  type="checkbox"
                  checked={multiAz}
                  onChange={(e) => {
                    setMultiAz(e.target.checked);
                    runTcoCalc();
                  }}
                  className="w-4 h-4 rounded text-blue-600 bg-slate-800 border-slate-700"
                />
              </div>
            </div>
          </div>

          {/* Cost Output Comparison */}
          {tcoResult && (
            <div className="lg:col-span-2 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-1">
                  <span className="text-[10px] font-bold uppercase text-slate-400">Total Monthly AWS</span>
                  <div className="text-2xl font-bold font-mono text-emerald-400">
                    ${tcoResult.total_monthly_aws_cost}
                  </div>
                  <p className="text-[10px] text-slate-500">${tcoResult.annual_aws_cost} / year</p>
                </div>

                <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-1">
                  <span className="text-[10px] font-bold uppercase text-slate-400">On-Premises Equivalent</span>
                  <div className="text-2xl font-bold font-mono text-slate-400">
                    ${tcoResult.comparative_on_premise_monthly}
                  </div>
                  <p className="text-[10px] text-slate-500">Hardware, power & admin</p>
                </div>

                <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-1">
                  <span className="text-[10px] font-bold uppercase text-slate-400">Total Cost Reduction</span>
                  <div className="text-2xl font-bold font-mono text-blue-400">
                    {tcoResult.savings_percentage}%
                  </div>
                  <p className="text-[10px] text-emerald-400 font-semibold">${tcoResult.annual_savings_usd} saved/yr</p>
                </div>
              </div>

              {/* Service Breakdown */}
              <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300">
                  Monthly AWS Cost Breakdown by Service
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                  <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800">
                    <span className="text-[10px] text-slate-500">EC2 & ALB Compute</span>
                    <div className="font-bold text-white font-mono">${tcoResult.monthly_ec2_cost}</div>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800">
                    <span className="text-[10px] text-slate-500">RDS PostgreSQL DB</span>
                    <div className="font-bold text-white font-mono">${tcoResult.monthly_rds_cost}</div>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800">
                    <span className="text-[10px] text-slate-500">S3 & Glacier Storage</span>
                    <div className="font-bold text-white font-mono">${tcoResult.monthly_s3_cost}</div>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800">
                    <span className="text-[10px] text-slate-500">CloudFront & WAF</span>
                    <div className="font-bold text-white font-mono">${tcoResult.monthly_cloudfront_waf_cost}</div>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800">
                    <span className="text-[10px] text-slate-500">CloudWatch Telemetry</span>
                    <div className="font-bold text-white font-mono">${tcoResult.monthly_cloudwatch_cost}</div>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800">
                    <span className="text-[10px] text-slate-500">Lambda Serverless</span>
                    <div className="font-bold text-white font-mono">${tcoResult.monthly_lambda_cost}</div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 4. Well-Architected Framework 6-Pillar Review */}
      {activeSubTab === 'well_architected' && waResult && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {Object.entries(waResult.pillar_scores).map(([pillar, score]) => (
              <div key={pillar} className="p-4 rounded-2xl bg-slate-900 border border-slate-800 text-center space-y-1">
                <span className="text-[10px] font-bold uppercase text-slate-400 truncate block">
                  {pillar.replace('_', ' ')}
                </span>
                <div className={`text-xl font-bold font-mono ${score >= 90 ? 'text-emerald-400' : 'text-amber-400'}`}>
                  {score} / 100
                </div>
              </div>
            ))}
          </div>

          <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200">
              Interactive 6-Pillar Well-Architected Compliance Checklist
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
              {[
                { id: 'sec_least_privilege', label: 'Security: IAM policies scoped to least-privilege tenant ARNs' },
                { id: 'sec_encryption', label: 'Security: Customer Managed KMS Key (CMK) encryption at rest' },
                { id: 'rel_multi_az', label: 'Reliability: Multi-AZ standby deployment for zero-downtime failover' },
                { id: 'rel_backup', label: 'Reliability: Automated daily cross-region snapshot replication' },
                { id: 'perf_graviton', label: 'Performance: AWS Graviton3 (ARM64) high price-performance compute' },
                { id: 'cost_lifecycle', label: 'Cost: Automated S3 Glacier lifecycle transitions for cold context' },
                { id: 'ops_iac', label: 'Operational Excellence: Infrastructure as Code (Terraform / CloudFormation)' },
                { id: 'sus_managed_services', label: 'Sustainability: Maximize serverless utilization to minimize idle compute' },
              ].map((q) => (
                <label 
                  key={q.id}
                  onClick={() => toggleWaQuestion(q.id)}
                  className="flex items-center space-x-3 p-3 rounded-xl bg-slate-950/70 border border-slate-800/80 cursor-pointer hover:border-slate-700"
                >
                  <input
                    type="checkbox"
                    checked={waAnswers[q.id] || false}
                    onChange={() => {}}
                    className="w-4 h-4 rounded text-blue-600 bg-slate-900 border-slate-700"
                  />
                  <span className="text-slate-200">{q.label}</span>
                </label>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
