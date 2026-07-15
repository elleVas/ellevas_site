#!/usr/bin/env node
import 'source-map-support/register.js';
import { App, Tags } from 'aws-cdk-lib';
import { DnsCertificateStack } from '../lib/dns-certificate-stack.js';
import { HostingStack } from '../lib/hosting-stack.js';
import { GitHubActionsStack } from '../lib/github-actions-stack.js';
import { BudgetStack } from '../lib/budget-stack.js';
import {
  ACCOUNT_ID,
  PRIMARY_REGION,
  CERTIFICATE_REGION,
  PROJECT_TAG,
} from '../lib/config.js';

const app = new App();

// ─── DNS + Certificate (must be in us-east-1 for CloudFront) ───────────

const dnsStack = new DnsCertificateStack(app, 'EllevasDnsCertificateStack', {
  env: { account: ACCOUNT_ID, region: CERTIFICATE_REGION },
  description: 'ACM certificate for ellevas.dev (DNS-validated via Route53)',
  crossRegionReferences: true,
});

// ─── Hosting (S3 + CloudFront + Route53 records) ───────────────────────

const hostingStack = new HostingStack(app, 'EllevasHostingStack', {
  env: { account: ACCOUNT_ID, region: PRIMARY_REGION },
  description: 'Static site hosting: S3 + CloudFront + Route53',
  crossRegionReferences: true,
  certificateArn: dnsStack.certificate.certificateArn,
});

// ─── GitHub Actions IAM Roles (OIDC) ──────────────────────────────────

new GitHubActionsStack(app, 'EllevasGitHubActionsStack', {
  env: { account: ACCOUNT_ID, region: PRIMARY_REGION },
  description: 'IAM roles for GitHub Actions CI/CD (OIDC federation)',
  siteBucketName: hostingStack.siteBucketName,
  distributionId: hostingStack.distributionId,
});

// ─── Budget Alerts ─────────────────────────────────────────────────────

new BudgetStack(app, 'EllevasBudgetStack', {
  env: { account: ACCOUNT_ID, region: PRIMARY_REGION },
  description: 'Monthly cost budget with email alerts at $1 and $5',
  alertEmail: 'raffaelevasini@gmail.com',
});

// ─── Global tags for cost tracking ────────────────────────────────────

Tags.of(app).add('Project', PROJECT_TAG);
