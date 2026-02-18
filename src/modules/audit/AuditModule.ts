import type {
  AssistantModule,
  Intent,
  ContextSnapshot,
  ModuleResult,
  ModuleConfig,
  ToolDefinition,
} from '../../core/types';
import { AuditService } from './AuditService';
import type { AuditInput } from './types';

export class AuditModule implements AssistantModule {
  id = 'audit';
  name = 'Production Readiness Auditor';
  description = 'Comprehensive production readiness and security audit for software projects';
  version = '1.0.0';
  triggers = ['audit', 'readiness', 'production ready', 'security audit', 'deployment audit'];

  private currentAudit: any = null;

  async init(_config: ModuleConfig) {
    // Initialization if needed
  }

  async destroy() {
    this.currentAudit = null;
  }

  canHandle(intent: Intent): boolean {
    const intentLower = intent.raw.toLowerCase();
    return this.triggers.some(trigger => intentLower.includes(trigger));
  }

  async handle(intent: Intent, _context: ContextSnapshot): Promise<ModuleResult> {
    try {
      // Parse intent to extract audit parameters
      const auditInput = this.parseAuditIntent(intent.raw);
      
      if (!auditInput) {
        return {
          success: false,
          error: 'Please provide audit parameters. Usage: audit [repository path or URL] [deployment URL] --pii --payments --secrets --audience [employee|public|both]',
          ui: 'chat',
        };
      }

      // Perform the audit
      const result = await AuditService.audit(auditInput);
      this.currentAudit = result;

      // Format the audit report
      const report = this.formatAuditReport(result);

      return {
        success: true,
        data: result,
        message: report,
        ui: 'chat',
      };
    } catch (error: any) {
      return {
        success: false,
        error: `Audit failed: ${error.message}`,
        ui: 'chat',
      };
    }
  }

  private parseAuditIntent(raw: string): AuditInput | null {
    // Simple parsing - in production would be more sophisticated
    const parts = raw.toLowerCase().split(' ');
    
    // Default values
    const input: AuditInput = {
      repositoryPath: '.',
      audience: 'employee',
      handlesPII: parts.includes('--pii') || parts.includes('pii'),
      handlesPayments: parts.includes('--payments') || parts.includes('payments'),
      handlesSecrets: parts.includes('--secrets') || parts.includes('secrets'),
    };

    // Extract repository URL/path
    const urlMatch = raw.match(/https?:\/\/[^\s]+/);
    if (urlMatch) {
      try {
        const url = new URL(urlMatch[0]);
        // Check if it's a git hosting platform by hostname
        if (url.hostname === 'github.com' || 
            url.hostname === 'gitlab.com' ||
            url.hostname === 'www.github.com' ||
            url.hostname === 'www.gitlab.com') {
          input.repositoryUrl = urlMatch[0];
        } else {
          input.deploymentUrl = urlMatch[0];
        }
      } catch {
        // Invalid URL, skip
      }
    }

    // Extract audience
    if (parts.includes('public')) {
      input.audience = 'public';
    } else if (parts.includes('both')) {
      input.audience = 'both';
    }

    return input;
  }

  private formatAuditReport(result: any): string {
    let report = '# PRODUCTION READINESS AUDIT REPORT\n\n';
    report += `**Audit Date:** ${new Date(result.timestamp).toLocaleString()}\n`;
    report += `**Audience:** ${result.input.audience}\n`;
    report += `**Handles PII:** ${result.input.handlesPII ? 'Yes' : 'No'}\n`;
    report += `**Handles Payments:** ${result.input.handlesPayments ? 'Yes' : 'No'}\n`;
    report += `**Handles Secrets:** ${result.input.handlesSecrets ? 'Yes' : 'No'}\n\n`;

    // Section A: Scorecard
    report += '## SECTION A — SCORECARD\n\n';
    report += '| Category | Score | Max | Status |\n';
    report += '|----------|-------|-----|--------|\n';
    
    result.phase1.categories.forEach((cat: any) => {
      const percentage = (cat.score / cat.maxScore * 100).toFixed(0);
      const status = cat.score >= 4 ? '✅' : cat.score >= 2 ? '⚠️' : '❌';
      report += `| ${cat.category} | ${cat.score} | ${cat.maxScore} | ${status} ${percentage}% |\n`;
    });
    
    report += `| **TOTAL** | **${result.phase1.totalScore}** | **${result.phase1.maxScore}** | **${(result.phase1.totalScore / result.phase1.maxScore * 100).toFixed(0)}%** |\n\n`;

    // Section B: Detailed Findings
    report += '## SECTION B — DETAILED FINDINGS\n\n';
    result.phase1.categories.forEach((cat: any) => {
      report += `### ${cat.category}\n`;
      report += `**Score: ${cat.score}/5**\n\n`;
      report += `**Reasoning:** ${cat.reasoning}\n\n`;
      report += '**Findings:**\n';
      cat.findings.forEach((finding: string) => {
        report += `- ${finding}\n`;
      });
      report += '\n';
    });

    // Phase 2: Runtime Check (if available)
    if (result.phase2) {
      report += '## RUNTIME CHECK\n\n';
      if (result.phase2.httpStatus) {
        report += `- HTTP Status: ${result.phase2.httpStatus}\n`;
        report += `- Response Time: ${result.phase2.responseTime}ms\n`;
      }
      result.phase2.findings.forEach((finding: string) => {
        report += `- ${finding}\n`;
      });
      report += '\n';
    }

    // Section C: Blockers
    report += '## SECTION C — BLOCKERS\n\n';
    report += '### Critical Blockers (MUST FIX BEFORE EMPLOYEE USE)\n';
    if (result.blockers.critical.length === 0) {
      report += '✅ No critical blockers\n\n';
    } else {
      result.blockers.critical.forEach((blocker: string, idx: number) => {
        report += `${idx + 1}. ${blocker}\n`;
      });
      report += '\n';
    }

    report += '### Public Launch Blockers\n';
    if (result.blockers.publicLaunch.length === 0) {
      report += '✅ No public launch blockers\n\n';
    } else {
      result.blockers.publicLaunch.forEach((blocker: string, idx: number) => {
        report += `${idx + 1}. ${blocker}\n`;
      });
      report += '\n';
    }

    // Section D: Readiness Verdict
    report += '## SECTION D — READINESS VERDICT\n\n';
    report += `### ${result.phase3.readinessLevel}\n`;
    report += `**Total Score: ${result.phase1.totalScore}/${result.phase1.maxScore}**\n\n`;
    report += `${result.phase3.interpretation}\n\n`;

    // Section E: Executive Summary
    report += '## SECTION E — EXECUTIVE SUMMARY\n\n';
    report += `**Safe for Employees?** ${result.phase4.safeForEmployees ? '✅ YES (with monitoring)' : '❌ NO'}\n`;
    report += `**Safe for Customers?** ${result.phase4.safeForCustomers ? '✅ YES' : '❌ NO'}\n\n`;
    
    report += `**What Would Break First:**\n${result.phase4.firstFailurePoint}\n\n`;

    if (result.phase4.securityConcerns.length > 0) {
      report += '**Security Concerns:**\n';
      result.phase4.securityConcerns.forEach((concern: string, idx: number) => {
        report += `${idx + 1}. ${concern}\n`;
      });
      report += '\n';
    }

    // Section F: Immediate Action Plan
    report += '## SECTION F — IMMEDIATE ACTION PLAN\n\n';
    report += '**Top 5 Highest-Leverage Improvements (Prioritized by Impact):**\n\n';
    result.improvements.forEach((improvement: string) => {
      report += `${improvement}\n`;
    });

    return report;
  }

  getTools(): ToolDefinition[] {
    return [
      {
        name: 'audit.run',
        description: 'Run a comprehensive production readiness audit on a software project',
        inputSchema: {
          type: 'object',
          properties: {
            repositoryPath: { type: 'string', description: 'Path to the repository' },
            repositoryUrl: { type: 'string', description: 'GitHub/GitLab repository URL' },
            deploymentUrl: { type: 'string', description: 'Deployed application URL for runtime checks' },
            audience: { type: 'string', enum: ['employee', 'public', 'both'] },
            handlesPII: { type: 'boolean' },
            handlesPayments: { type: 'boolean' },
            handlesSecrets: { type: 'boolean' },
          },
          required: ['audience'],
        },
      },
      {
        name: 'audit.get_current',
        description: 'Get the most recent audit results',
        inputSchema: { type: 'object', properties: {} },
      },
    ];
  }

  async executeTool(name: string, args: Record<string, unknown>) {
    switch (name) {
      case 'audit.run': {
        const input: AuditInput = {
          repositoryPath: (args.repositoryPath as string) || '.',
          repositoryUrl: args.repositoryUrl as string | undefined,
          deploymentUrl: args.deploymentUrl as string | undefined,
          audience: (args.audience as 'employee' | 'public' | 'both') || 'employee',
          handlesPII: Boolean(args.handlesPII),
          handlesPayments: Boolean(args.handlesPayments),
          handlesSecrets: Boolean(args.handlesSecrets),
        };
        const result = await AuditService.audit(input);
        this.currentAudit = result;
        return { success: true, data: result };
      }
      case 'audit.get_current':
        return this.currentAudit
          ? { success: true, data: this.currentAudit }
          : { success: false, error: 'No audit has been run yet' };
      default:
        return { success: false, error: `Unknown tool: ${name}` };
    }
  }
}
