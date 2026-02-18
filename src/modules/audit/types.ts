export interface AuditInput {
  repositoryUrl?: string;
  repositoryPath?: string;
  deploymentUrl?: string;
  audience: 'employee' | 'public' | 'both';
  handlesPII: boolean;
  handlesPayments: boolean;
  handlesSecrets: boolean;
}

export interface CategoryScore {
  category: string;
  score: number;
  maxScore: number;
  findings: string[];
  reasoning: string;
}

export interface AuditResult {
  input: AuditInput;
  timestamp: string;
  phase1: {
    categories: CategoryScore[];
    totalScore: number;
    maxScore: number;
  };
  phase2?: {
    httpStatus?: number;
    responseTime?: number;
    findings: string[];
  };
  phase3: {
    readinessLevel: 'Prototype' | 'Dev Preview' | 'Employee Pilot Ready' | 'Public Beta Ready' | 'Production Ready';
    interpretation: string;
  };
  phase4: {
    safeForEmployees: boolean;
    safeForCustomers: boolean;
    firstFailurePoint: string;
    securityConcerns: string[];
  };
  blockers: {
    critical: string[];
    publicLaunch: string[];
  };
  improvements: string[];
}

export interface AuditConfig {
  strictMode: boolean;
  includeSuggestions: boolean;
}
