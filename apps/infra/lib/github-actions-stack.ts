import { Stack, type StackProps, Duration } from 'aws-cdk-lib';
import * as iam from 'aws-cdk-lib/aws-iam';
import type { Construct } from 'constructs';
import { ACCOUNT_ID, DOMAIN_NAME } from './config.js';

/**
 * GitHub repository allowed to assume the deploy role.
 * Format: "repo:<owner>/<repo>:ref:refs/heads/<branch>"
 */
const GITHUB_REPO = 'elleVas/ellevas_site';
const ALLOWED_BRANCH = 'main';

export interface GitHubActionsStackProps extends StackProps {
  /** S3 bucket name where the site is hosted */
  siteBucketName: string;
  /** CloudFront distribution ID for cache invalidation */
  distributionId: string;
}

/**
 * GitHubActionsStack
 *
 * Creates an IAM Role assumable exclusively by GitHub Actions
 * from the specified repository and branch via OIDC federation.
 *
 * Permissions are scoped to the minimum required:
 * - S3: upload/delete objects in the site bucket
 * - CloudFront: create cache invalidations
 * - CloudFormation/CDK: deploy infrastructure stacks
 */
export class GitHubActionsStack extends Stack {
  constructor(scope: Construct, id: string, props: GitHubActionsStackProps) {
    super(scope, id, props);

    const oidcProvider = iam.OpenIdConnectProvider.fromOpenIdConnectProviderArn(
      this,
      'GitHubOidcProvider',
      `arn:aws:iam::${ACCOUNT_ID}:oidc-provider/token.actions.githubusercontent.com`,
    );

    // ─── Deploy Role (site) ────────────────────────────────────────────

    const siteDeployRole = new iam.Role(this, 'SiteDeployRole', {
      roleName: 'ellevas-site-github-deploy',
      description: 'Assumed by GitHub Actions to deploy the static site to S3 + CloudFront',
      assumedBy: new iam.WebIdentityPrincipal(oidcProvider.openIdConnectProviderArn, {
        StringEquals: {
          'token.actions.githubusercontent.com:aud': 'sts.amazonaws.com',
        },
        StringLike: {
          'token.actions.githubusercontent.com:sub': `repo:${GITHUB_REPO}:ref:refs/heads/${ALLOWED_BRANCH}`,
        },
      }),
      maxSessionDuration: Duration.hours(1),
    });

    // S3 permissions — upload and delete site assets only
    siteDeployRole.addToPolicy(
      new iam.PolicyStatement({
        sid: 'S3SiteAssets',
        effect: iam.Effect.ALLOW,
        actions: ['s3:PutObject', 's3:DeleteObject', 's3:ListBucket', 's3:GetBucketLocation'],
        resources: [
          `arn:aws:s3:::${props.siteBucketName}`,
          `arn:aws:s3:::${props.siteBucketName}/*`,
        ],
      }),
    );

    // CloudFront — invalidate cache only for this distribution
    siteDeployRole.addToPolicy(
      new iam.PolicyStatement({
        sid: 'CloudFrontInvalidation',
        effect: iam.Effect.ALLOW,
        actions: ['cloudfront:CreateInvalidation'],
        resources: [
          `arn:aws:cloudfront::${ACCOUNT_ID}:distribution/${props.distributionId}`,
        ],
      }),
    );

    // ─── Infra Deploy Role ─────────────────────────────────────────────

    const infraDeployRole = new iam.Role(this, 'InfraDeployRole', {
      roleName: 'ellevas-infra-github-deploy',
      description: 'Assumed by GitHub Actions to deploy CDK infrastructure',
      assumedBy: new iam.WebIdentityPrincipal(oidcProvider.openIdConnectProviderArn, {
        StringEquals: {
          'token.actions.githubusercontent.com:aud': 'sts.amazonaws.com',
        },
        StringLike: {
          'token.actions.githubusercontent.com:sub': `repo:${GITHUB_REPO}:ref:refs/heads/${ALLOWED_BRANCH}`,
        },
      }),
      maxSessionDuration: Duration.hours(1),
    });

    // CDK deploy needs broad permissions for CloudFormation + the resources it manages.
    // Scoped to the CDK bootstrap role pattern for safety.
    infraDeployRole.addToPolicy(
      new iam.PolicyStatement({
        sid: 'CdkDeployAccess',
        effect: iam.Effect.ALLOW,
        actions: ['sts:AssumeRole'],
        resources: [
          `arn:aws:iam::${ACCOUNT_ID}:role/cdk-*`,
        ],
      }),
    );
  }
}
