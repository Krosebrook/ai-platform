import type { AuditInput, AuditResult, CategoryScore } from './types';
import { AuditFS } from './AuditFS';

export class AuditService {
  /**
   * Main audit function
   */
  static async audit(input: AuditInput): Promise<AuditResult> {
    const timestamp = new Date().toISOString();
    
    // Phase 1: Repository & Deployment Audit
    const categories = await this.performPhase1(input);
    const totalScore = categories.reduce((sum, cat) => sum + cat.score, 0);
    const maxScore = categories.reduce((sum, cat) => sum + cat.maxScore, 0);
    
    // Phase 2: Runtime Check (if deployment URL exists)
    const phase2 = input.deploymentUrl ? await this.performPhase2(input.deploymentUrl) : undefined;
    
    // Phase 3: Readiness Classification
    const phase3 = this.performPhase3(totalScore);
    
    // Phase 4: Executive Summary
    const phase4 = this.performPhase4(categories, totalScore, input);
    
    // Generate blockers and improvements
    const blockers = this.generateBlockers(categories, input);
    const improvements = this.generateImprovements(categories);
    
    return {
      input,
      timestamp,
      phase1: { categories, totalScore, maxScore },
      phase2,
      phase3,
      phase4,
      blockers,
      improvements,
    };
  }
  
  /**
   * Phase 1: Evaluate all categories
   */
  private static async performPhase1(input: AuditInput): Promise<CategoryScore[]> {
    const repoPath = input.repositoryPath || '.';
    
    return [
      await this.auditIdentityAndAccess(repoPath, input),
      await this.auditSecretsAndConfig(repoPath, input),
      await this.auditDataSafety(repoPath, input),
      await this.auditReliability(repoPath, input),
      await this.auditObservability(repoPath, input),
      await this.auditCICD(repoPath, input),
      await this.auditSecurity(repoPath, input),
      await this.auditTesting(repoPath, input),
      await this.auditPerformance(repoPath, input),
      await this.auditDocumentation(repoPath, input),
    ];
  }
  
  /**
   * Category 1: Identity & Access Control (0-5)
   */
  private static async auditIdentityAndAccess(repoPath: string, input: AuditInput): Promise<CategoryScore> {
    const findings: string[] = [];
    let score = 0;
    
    // Check for authentication implementation
    const hasAuth = await this.checkForPattern(repoPath, ['auth', 'authentication', 'login', 'jwt', 'session']);
    if (!hasAuth) {
      findings.push('❌ No authentication implementation found');
    } else {
      findings.push('✓ Authentication implementation detected');
      score += 1;
    }
    
    // Check for RBAC
    const hasRBAC = await this.checkForPattern(repoPath, ['role', 'permission', 'rbac', 'authorization', 'access control']);
    if (!hasRBAC) {
      findings.push('❌ No role-based access control found');
    } else {
      findings.push('✓ RBAC detected');
      score += 1;
    }
    
    // Check for hardcoded credentials
    const hasHardcodedCreds = await this.checkForPattern(repoPath, ['password=', 'api_key=', 'secret=', 'token='], true);
    if (hasHardcodedCreds) {
      findings.push('⚠️  Potential hardcoded credentials detected');
    } else {
      findings.push('✓ No obvious hardcoded credentials');
      score += 1;
    }
    
    // Least privilege check
    if (hasAuth && hasRBAC) {
      findings.push('✓ Least privilege principle likely implemented');
      score += 2;
    } else {
      findings.push('❌ Least privilege principle not evident');
    }
    
    return {
      category: '1. Identity & Access Control',
      score,
      maxScore: 5,
      findings,
      reasoning: score < 3 
        ? 'Critical gaps in authentication and authorization. Not safe for any production use.'
        : score < 5
        ? 'Basic auth exists but missing key components like RBAC or hardcoded secrets present.'
        : 'Authentication and authorization properly implemented.',
    };
  }
  
  /**
   * Category 2: Secrets & Configuration Hygiene (0-5)
   */
  private static async auditSecretsAndConfig(repoPath: string, input: AuditInput): Promise<CategoryScore> {
    const findings: string[] = [];
    let score = 0;
    
    // Check for .env usage
    const hasEnvFile = await this.checkFileExists(repoPath, '.env.example') || 
                       await this.checkFileExists(repoPath, '.env.template');
    if (hasEnvFile) {
      findings.push('✓ .env template found');
      score += 1;
    } else {
      findings.push('❌ No .env template found');
    }
    
    // Check .gitignore for secrets
    const hasGitignore = await this.checkFileExists(repoPath, '.gitignore');
    if (hasGitignore) {
      const ignoresEnv = await this.checkFileContains(repoPath, '.gitignore', '.env');
      if (ignoresEnv) {
        findings.push('✓ .gitignore excludes .env files');
        score += 1;
      } else {
        findings.push('⚠️  .gitignore may not exclude .env files');
      }
    } else {
      findings.push('❌ No .gitignore found');
    }
    
    // Check for committed secrets
    const hasCommittedSecrets = await this.checkForPattern(repoPath, [
      'aws_access_key_id',
      'private_key',
      'BEGIN RSA PRIVATE KEY',
      'sk_live_',
      'sk_test_',
    ], true);
    if (hasCommittedSecrets) {
      findings.push('🚨 CRITICAL: Potential secrets committed to repo');
      score = Math.min(score, 1); // Cap at 1 if secrets found
    } else {
      findings.push('✓ No obvious committed secrets');
      score += 2;
    }
    
    // Check for config documentation
    const hasConfigDocs = await this.checkForPattern(repoPath, ['configuration', 'config', 'setup', 'environment variables']);
    if (hasConfigDocs) {
      findings.push('✓ Configuration documented');
      score += 1;
    } else {
      findings.push('❌ Configuration not documented');
    }
    
    return {
      category: '2. Secrets & Configuration Hygiene',
      score,
      maxScore: 5,
      findings,
      reasoning: hasCommittedSecrets
        ? 'CRITICAL: Secrets appear to be committed. This is a security incident.'
        : score < 3
        ? 'Poor secret management. High risk of exposure.'
        : 'Adequate secret management practices.',
    };
  }
  
  /**
   * Category 3: Data Safety & Privacy (0-5)
   */
  private static async auditDataSafety(repoPath: string, input: AuditInput): Promise<CategoryScore> {
    const findings: string[] = [];
    let score = 0;
    
    // Check for database usage
    const hasDatabase = await this.checkForPattern(repoPath, ['database', 'db', 'postgres', 'mysql', 'mongodb', 'sqlite']);
    if (hasDatabase) {
      findings.push('✓ Database usage detected');
      
      // Check for encryption
      const hasEncryption = await this.checkForPattern(repoPath, ['encrypt', 'crypto', 'cipher', 'bcrypt', 'hash']);
      if (hasEncryption) {
        findings.push('✓ Encryption mechanisms found');
        score += 2;
      } else {
        findings.push('❌ No encryption found');
      }
    } else {
      findings.push('⚠️  No database detected (data storage unclear)');
      findings.push('UNVERIFIED — ASSUME MISSING');
    }
    
    // Check for backup strategy
    const hasBackup = await this.checkForPattern(repoPath, ['backup', 'snapshot', 'replication']);
    if (hasBackup) {
      findings.push('✓ Backup strategy detected');
      score += 1;
    } else {
      findings.push('❌ No backup strategy evident');
    }
    
    // Check for data retention policy
    const hasRetention = await this.checkForPattern(repoPath, ['retention', 'gdpr', 'data policy', 'deletion']);
    if (hasRetention) {
      findings.push('✓ Data retention considerations found');
      score += 1;
    } else {
      findings.push('❌ No data retention policy');
    }
    
    // PII handling check
    if (input.handlesPII) {
      const hasPIIProtection = await this.checkForPattern(repoPath, ['pii', 'personal data', 'anonymize', 'pseudonymize']);
      if (hasPIIProtection) {
        findings.push('✓ PII protection measures found');
        score += 1;
      } else {
        findings.push('🚨 CRITICAL: Handles PII but no protection measures found');
      }
    } else {
      score += 1; // Bonus for not handling PII
    }
    
    return {
      category: '3. Data Safety & Privacy',
      score,
      maxScore: 5,
      findings,
      reasoning: input.handlesPII && score < 3
        ? 'CRITICAL: Handles PII without adequate protection.'
        : score < 2
        ? 'Data safety is unverified or missing. Not safe for production.'
        : 'Basic data safety measures in place.',
    };
  }
  
  /**
   * Category 4: Reliability & Error Handling (0-5)
   */
  private static async auditReliability(repoPath: string, input: AuditInput): Promise<CategoryScore> {
    const findings: string[] = [];
    let score = 0;
    
    // Check for error handling
    const hasErrorHandling = await this.checkForPattern(repoPath, ['try', 'catch', 'error', 'exception']);
    if (hasErrorHandling) {
      findings.push('✓ Error handling present');
      score += 1;
    } else {
      findings.push('❌ No error handling found');
    }
    
    // Check for timeouts
    const hasTimeouts = await this.checkForPattern(repoPath, ['timeout', 'deadline', 'abort']);
    if (hasTimeouts) {
      findings.push('✓ Timeout mechanisms found');
      score += 1;
    } else {
      findings.push('❌ No timeout handling');
    }
    
    // Check for retries
    const hasRetries = await this.checkForPattern(repoPath, ['retry', 'backoff', 'exponential']);
    if (hasRetries) {
      findings.push('✓ Retry logic detected');
      score += 1;
    } else {
      findings.push('❌ No retry mechanisms');
    }
    
    // Check for graceful degradation
    const hasGraceful = await this.checkForPattern(repoPath, ['fallback', 'graceful', 'circuit breaker']);
    if (hasGraceful) {
      findings.push('✓ Graceful degradation patterns found');
      score += 2;
    } else {
      findings.push('❌ No fail-safe logic evident');
    }
    
    return {
      category: '4. Reliability & Error Handling',
      score,
      maxScore: 5,
      findings,
      reasoning: score < 2
        ? 'Will crash under any error condition. Not production ready.'
        : score < 4
        ? 'Basic error handling but missing resilience patterns.'
        : 'Robust error handling and resilience implemented.',
    };
  }
  
  /**
   * Category 5: Observability & Monitoring (0-5)
   */
  private static async auditObservability(repoPath: string, input: AuditInput): Promise<CategoryScore> {
    const findings: string[] = [];
    let score = 0;
    
    // Check for logging
    const hasLogging = await this.checkForPattern(repoPath, ['console.log', 'logger', 'log.', 'logging']);
    if (hasLogging) {
      findings.push('✓ Logging implemented');
      score += 1;
      
      // Check for structured logging
      const hasStructured = await this.checkForPattern(repoPath, ['winston', 'pino', 'bunyan', 'structured']);
      if (hasStructured) {
        findings.push('✓ Structured logging detected');
        score += 1;
      } else {
        findings.push('⚠️  Logging not structured');
      }
    } else {
      findings.push('❌ No logging found');
    }
    
    // Check for error tracking
    const hasErrorTracking = await this.checkForPattern(repoPath, ['sentry', 'bugsnag', 'rollbar', 'error tracking']);
    if (hasErrorTracking) {
      findings.push('✓ Error tracking service integrated');
      score += 1;
    } else {
      findings.push('❌ No error tracking');
    }
    
    // Check for metrics
    const hasMetrics = await this.checkForPattern(repoPath, ['metrics', 'prometheus', 'datadog', 'cloudwatch']);
    if (hasMetrics) {
      findings.push('✓ Metrics collection found');
      score += 1;
    } else {
      findings.push('❌ No metrics');
    }
    
    // Check for alerts
    const hasAlerts = await this.checkForPattern(repoPath, ['alert', 'notification', 'pagerduty', 'opsgenie']);
    if (hasAlerts) {
      findings.push('✓ Alerting configured');
      score += 1;
    } else {
      findings.push('❌ No alerting system');
    }
    
    return {
      category: '5. Observability & Monitoring',
      score,
      maxScore: 5,
      findings,
      reasoning: score < 2
        ? 'Blind in production. Cannot debug or respond to issues.'
        : score < 4
        ? 'Basic logging exists but missing critical observability.'
        : 'Comprehensive observability stack.',
    };
  }
  
  /**
   * Category 6: CI/CD & Deployment Safety (0-5)
   */
  private static async auditCICD(repoPath: string, input: AuditInput): Promise<CategoryScore> {
    const findings: string[] = [];
    let score = 0;
    
    // Check for CI configuration
    const hasCI = await this.checkFileExists(repoPath, '.github/workflows') ||
                  await this.checkFileExists(repoPath, '.gitlab-ci.yml') ||
                  await this.checkFileExists(repoPath, '.circleci/config.yml') ||
                  await this.checkFileExists(repoPath, 'Jenkinsfile');
    
    if (hasCI) {
      findings.push('✓ CI configuration present');
      score += 1;
      
      // Check if tests run in CI
      const testsInCI = await this.checkForPattern(repoPath, ['npm test', 'pytest', 'jest', 'test:']);
      if (testsInCI) {
        findings.push('✓ Tests run in CI');
        score += 1;
      } else {
        findings.push('❌ Tests not run in CI');
      }
      
      // Check for linting
      const hasLinting = await this.checkForPattern(repoPath, ['eslint', 'prettier', 'lint', 'black', 'flake8']);
      if (hasLinting) {
        findings.push('✓ Linting configured');
        score += 1;
      } else {
        findings.push('❌ No linting');
      }
    } else {
      findings.push('❌ No CI/CD pipeline found');
    }
    
    // Check for build verification
    const hasBuildVerification = await this.checkForPattern(repoPath, ['build', 'compile', 'bundle']);
    if (hasBuildVerification) {
      findings.push('✓ Build process exists');
      score += 1;
    } else {
      findings.push('❌ No build verification');
    }
    
    // Check for deployment strategy
    const hasDeployment = await this.checkForPattern(repoPath, ['deploy', 'release', 'rollback', 'blue-green', 'canary']);
    if (hasDeployment) {
      findings.push('✓ Deployment strategy detected');
      score += 1;
    } else {
      findings.push('❌ No rollback strategy');
    }
    
    return {
      category: '6. CI/CD & Deployment Safety',
      score,
      maxScore: 5,
      findings,
      reasoning: score < 2
        ? 'No automated testing or deployment safety. Every deploy is Russian roulette.'
        : score < 4
        ? 'Basic CI exists but missing key safety checks.'
        : 'Robust CI/CD pipeline with safety checks.',
    };
  }
  
  /**
   * Category 7: Security Hardening (0-5)
   */
  private static async auditSecurity(repoPath: string, input: AuditInput): Promise<CategoryScore> {
    const findings: string[] = [];
    let score = 0;
    
    // Check for input validation
    const hasValidation = await this.checkForPattern(repoPath, ['validate', 'sanitize', 'escape', 'xss']);
    if (hasValidation) {
      findings.push('✓ Input validation detected');
      score += 1;
    } else {
      findings.push('❌ No input validation');
    }
    
    // Check for rate limiting
    const hasRateLimit = await this.checkForPattern(repoPath, ['rate limit', 'throttle', 'rate-limit']);
    if (hasRateLimit) {
      findings.push('✓ Rate limiting found');
      score += 1;
    } else {
      findings.push('❌ No rate limiting');
    }
    
    // Check for CORS configuration
    const hasCORS = await this.checkForPattern(repoPath, ['cors', 'access-control-allow']);
    if (hasCORS) {
      findings.push('✓ CORS configured');
      score += 1;
    } else {
      findings.push('⚠️  CORS not configured');
    }
    
    // Check for CSP
    const hasCSP = await this.checkForPattern(repoPath, ['content-security-policy', 'csp']);
    if (hasCSP) {
      findings.push('✓ CSP headers found');
      score += 1;
    } else {
      findings.push('❌ No CSP headers');
    }
    
    // Check for dependency scanning
    const hasDependencyScan = await this.checkFileExists(repoPath, '.github/dependabot.yml') ||
                               await this.checkForPattern(repoPath, ['snyk', 'dependabot', 'renovate']);
    if (hasDependencyScan) {
      findings.push('✓ Dependency scanning enabled');
      score += 1;
    } else {
      findings.push('❌ No dependency scanning');
    }
    
    return {
      category: '7. Security Hardening',
      score,
      maxScore: 5,
      findings,
      reasoning: score < 2
        ? 'Major security gaps. Vulnerable to common attacks (XSS, injection, DoS).'
        : score < 4
        ? 'Basic security but missing key hardening measures.'
        : 'Strong security posture.',
    };
  }
  
  /**
   * Category 8: Testing Coverage (0-5)
   */
  private static async auditTesting(repoPath: string, input: AuditInput): Promise<CategoryScore> {
    const findings: string[] = [];
    let score = 0;
    
    // Check for test files
    const hasTests = await this.checkForPattern(repoPath, ['.test.', '.spec.', '__tests__', 'test/']);
    if (hasTests) {
      findings.push('✓ Test files found');
      score += 1;
      
      // Check for unit tests
      const hasUnitTests = await this.checkForPattern(repoPath, ['describe(', 'it(', 'test(', 'def test_']);
      if (hasUnitTests) {
        findings.push('✓ Unit tests present');
        score += 1;
      }
      
      // Check for integration tests
      const hasIntegrationTests = await this.checkForPattern(repoPath, ['integration', 'e2e', 'end-to-end']);
      if (hasIntegrationTests) {
        findings.push('✓ Integration tests detected');
        score += 1;
      } else {
        findings.push('❌ No integration tests');
      }
      
      // Check for test coverage
      const hasCoverage = await this.checkForPattern(repoPath, ['coverage', 'nyc', 'istanbul', 'pytest-cov']);
      if (hasCoverage) {
        findings.push('✓ Test coverage tracking');
        score += 2;
      } else {
        findings.push('❌ No coverage tracking');
      }
    } else {
      findings.push('❌ No tests found');
    }
    
    return {
      category: '8. Testing Coverage',
      score,
      maxScore: 5,
      findings,
      reasoning: score === 0
        ? 'No tests. Every deployment is a gamble.'
        : score < 3
        ? 'Minimal testing. Not enough to catch regressions.'
        : 'Good test coverage.',
    };
  }
  
  /**
   * Category 9: Performance & Cost Controls (0-5)
   */
  private static async auditPerformance(repoPath: string, input: AuditInput): Promise<CategoryScore> {
    const findings: string[] = [];
    let score = 0;
    
    // Check for rate limiting (overlaps with security but different concern)
    const hasRateLimit = await this.checkForPattern(repoPath, ['rate limit', 'throttle', 'quota']);
    if (hasRateLimit) {
      findings.push('✓ Rate limiting for cost control');
      score += 1;
    } else {
      findings.push('❌ No API rate limits');
    }
    
    // Check for resource limits
    const hasResourceLimits = await this.checkForPattern(repoPath, ['maxConnections', 'memory limit', 'cpu limit', 'timeout']);
    if (hasResourceLimits) {
      findings.push('✓ Resource limits configured');
      score += 1;
    } else {
      findings.push('❌ No resource limits');
    }
    
    // Check for caching
    const hasCaching = await this.checkForPattern(repoPath, ['cache', 'redis', 'memcached', 'cdn']);
    if (hasCaching) {
      findings.push('✓ Caching strategy present');
      score += 2;
    } else {
      findings.push('❌ No caching');
    }
    
    // Check for performance monitoring
    const hasPerformanceMonitoring = await this.checkForPattern(repoPath, ['performance', 'apm', 'new relic', 'datadog']);
    if (hasPerformanceMonitoring) {
      findings.push('✓ Performance monitoring');
      score += 1;
    } else {
      findings.push('❌ No performance monitoring');
    }
    
    return {
      category: '9. Performance & Cost Controls',
      score,
      maxScore: 5,
      findings,
      reasoning: score < 2
        ? 'Will scale costs linearly with load. No optimization.'
        : score < 4
        ? 'Basic controls but missing key optimizations.'
        : 'Good performance and cost management.',
    };
  }
  
  /**
   * Category 10: Documentation & Operational Readiness (0-5)
   */
  private static async auditDocumentation(repoPath: string, input: AuditInput): Promise<CategoryScore> {
    const findings: string[] = [];
    let score = 0;
    
    // Check for README
    const hasReadme = await this.checkFileExists(repoPath, 'README.md');
    if (hasReadme) {
      findings.push('✓ README present');
      score += 1;
      
      // Check if README has setup instructions
      const hasSetup = await this.checkFileContains(repoPath, 'README.md', 'install') ||
                       await this.checkFileContains(repoPath, 'README.md', 'setup');
      if (hasSetup) {
        findings.push('✓ Setup instructions found');
        score += 1;
      } else {
        findings.push('❌ No setup instructions');
      }
    } else {
      findings.push('❌ No README');
    }
    
    // Check for runbook
    const hasRunbook = await this.checkForPattern(repoPath, ['runbook', 'playbook', 'operations', 'ops guide']);
    if (hasRunbook) {
      findings.push('✓ Runbook/operations guide found');
      score += 2;
    } else {
      findings.push('❌ No runbook');
    }
    
    // Check for incident procedures
    const hasIncidentProc = await this.checkForPattern(repoPath, ['incident', 'emergency', 'escalation', 'on-call']);
    if (hasIncidentProc) {
      findings.push('✓ Incident procedures documented');
      score += 1;
    } else {
      findings.push('❌ No incident procedures');
    }
    
    return {
      category: '10. Documentation & Operational Readiness',
      score,
      maxScore: 5,
      findings,
      reasoning: score < 2
        ? 'New team members cannot onboard. No operational guidance.'
        : score < 4
        ? 'Basic documentation but missing operational details.'
        : 'Comprehensive documentation and operational readiness.',
    };
  }
  
  /**
   * Phase 2: Runtime Check
   */
  private static async performPhase2(deploymentUrl: string): Promise<{
    httpStatus?: number;
    responseTime?: number;
    findings: string[];
  }> {
    const findings: string[] = [];
    
    try {
      const startTime = Date.now();
      const response = await fetch(deploymentUrl, {
        method: 'GET',
        signal: AbortSignal.timeout(10000),
      });
      const responseTime = Date.now() - startTime;
      
      findings.push(`✓ Site accessible (HTTP ${response.status})`);
      findings.push(`Response time: ${responseTime}ms`);
      
      // Check headers
      const headers = response.headers;
      
      if (!headers.get('x-frame-options')) {
        findings.push('⚠️  Missing X-Frame-Options header');
      }
      
      if (!headers.get('content-security-policy')) {
        findings.push('⚠️  Missing Content-Security-Policy header');
      }
      
      if (!headers.get('strict-transport-security')) {
        findings.push('⚠️  Missing HSTS header');
      }
      
      if (headers.get('server')) {
        findings.push('⚠️  Server header exposes technology stack');
      }
      
      return {
        httpStatus: response.status,
        responseTime,
        findings,
      };
    } catch (error: any) {
      findings.push(`❌ Site not accessible: ${error.message}`);
      return { findings };
    }
  }
  
  /**
   * Phase 3: Readiness Classification
   */
  private static performPhase3(totalScore: number): {
    readinessLevel: 'Prototype' | 'Dev Preview' | 'Employee Pilot Ready' | 'Public Beta Ready' | 'Production Ready';
    interpretation: string;
  } {
    if (totalScore >= 45) {
      return {
        readinessLevel: 'Production Ready',
        interpretation: 'This software meets production standards. Still recommend a security review before public launch.',
      };
    } else if (totalScore >= 38) {
      return {
        readinessLevel: 'Public Beta Ready',
        interpretation: 'Suitable for public beta with clear disclaimers. Monitor closely and have support ready.',
      };
    } else if (totalScore >= 30) {
      return {
        readinessLevel: 'Employee Pilot Ready',
        interpretation: 'Can be used internally with supervision. Not ready for external users.',
      };
    } else if (totalScore >= 20) {
      return {
        readinessLevel: 'Dev Preview',
        interpretation: 'Early development stage. Only for developer testing.',
      };
    } else {
      return {
        readinessLevel: 'Prototype',
        interpretation: 'Early prototype. Not suitable for any real usage.',
      };
    }
  }
  
  /**
   * Phase 4: Executive Summary
   */
  private static performPhase4(
    categories: CategoryScore[],
    totalScore: number,
    input: AuditInput
  ): {
    safeForEmployees: boolean;
    safeForCustomers: boolean;
    firstFailurePoint: string;
    securityConcerns: string[];
  } {
    const securityConcerns: string[] = [];
    
    // Analyze each category for critical issues
    categories.forEach(cat => {
      if (cat.score < 2) {
        securityConcerns.push(`${cat.category}: Critical gaps - ${cat.reasoning}`);
      }
    });
    
    // Identity check
    const identityScore = categories.find(c => c.category.includes('Identity'))?.score || 0;
    if (identityScore < 3) {
      securityConcerns.push('Authentication/Authorization insufficient for any production use');
    }
    
    // Secrets check
    const secretsScore = categories.find(c => c.category.includes('Secrets'))?.score || 0;
    if (secretsScore < 3) {
      securityConcerns.push('Secret management inadequate - high risk of credential exposure');
    }
    
    // Data safety for PII
    if (input.handlesPII) {
      const dataScore = categories.find(c => c.category.includes('Data'))?.score || 0;
      if (dataScore < 3) {
        securityConcerns.push('CRITICAL: Handles PII without adequate protection measures');
      }
    }
    
    // Observability
    const obsScore = categories.find(c => c.category.includes('Observability'))?.score || 0;
    const firstFailurePoint = obsScore < 2
      ? 'Will fail silently with no way to debug. First real error will be undiagnosable.'
      : totalScore < 30
      ? 'Lack of resilience - will crash under error conditions or high load.'
      : 'Should handle normal operations but may struggle under stress.';
    
    return {
      safeForEmployees: totalScore >= 30 && identityScore >= 3,
      safeForCustomers: totalScore >= 38 && identityScore >= 4 && (input.handlesPII ? categories.find(c => c.category.includes('Data'))?.score! >= 4 : true),
      firstFailurePoint,
      securityConcerns,
    };
  }
  
  /**
   * Generate blockers
   */
  private static generateBlockers(categories: CategoryScore[], input: AuditInput): {
    critical: string[];
    publicLaunch: string[];
  } {
    const critical: string[] = [];
    const publicLaunch: string[] = [];
    
    categories.forEach(cat => {
      if (cat.score === 0) {
        critical.push(`${cat.category}: Complete absence of ${cat.category.split('.')[1]}`);
      } else if (cat.score < 2) {
        critical.push(`${cat.category}: ${cat.reasoning}`);
      } else if (cat.score < 4) {
        publicLaunch.push(`${cat.category}: ${cat.reasoning}`);
      }
    });
    
    // Special blockers for specific scenarios
    if (input.handlesPII) {
      const dataScore = categories.find(c => c.category.includes('Data'))?.score || 0;
      if (dataScore < 4) {
        publicLaunch.push('PII handling: Insufficient data protection for handling personal information');
      }
    }
    
    if (input.handlesPayments) {
      const securityScore = categories.find(c => c.category.includes('Security'))?.score || 0;
      if (securityScore < 4) {
        critical.push('Payment handling: Security hardening insufficient for payment processing');
      }
    }
    
    return { critical, publicLaunch };
  }
  
  /**
   * Generate top improvements
   */
  private static generateImprovements(categories: CategoryScore[]): string[] {
    const improvements: { category: string; score: number; impact: number }[] = categories
      .map(cat => ({
        category: cat.category,
        score: cat.score,
        impact: (cat.maxScore - cat.score) * (cat.score < 2 ? 3 : 1), // Prioritize critical gaps
      }))
      .sort((a, b) => b.impact - a.impact);
    
    return improvements.slice(0, 5).map((imp, idx) => {
      const cat = categories.find(c => c.category === imp.category)!;
      return `${idx + 1}. ${imp.category} (Score: ${imp.score}/5) - ${cat.reasoning}`;
    });
  }
  
  // Helper methods for file system checks
  private static async checkFileExists(repoPath: string, filename: string): Promise<boolean> {
    return AuditFS.checkFileExists(repoPath, filename);
  }
  
  private static async checkFileContains(repoPath: string, filename: string, pattern: string): Promise<boolean> {
    return AuditFS.checkFileContains(repoPath, filename, pattern);
  }
  
  private static async checkForPattern(repoPath: string, patterns: string[], exact: boolean = false): Promise<boolean> {
    return AuditFS.checkForPattern(repoPath, patterns, exact);
  }
}
