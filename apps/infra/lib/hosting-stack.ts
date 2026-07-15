import { Stack, type StackProps, CfnOutput, RemovalPolicy, Duration } from 'aws-cdk-lib';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import * as origins from 'aws-cdk-lib/aws-cloudfront-origins';
import * as route53 from 'aws-cdk-lib/aws-route53';
import * as route53Targets from 'aws-cdk-lib/aws-route53-targets';
import * as acm from 'aws-cdk-lib/aws-certificatemanager';
import type { Construct } from 'constructs';
import { DOMAIN_NAME, WWW_DOMAIN } from './config.js';

export interface HostingStackProps extends StackProps {
  /** ACM certificate ARN from the DnsCertificateStack (us-east-1) */
  certificateArn: string;
}

/**
 * HostingStack
 *
 * Deploys the static site infrastructure:
 * - Private S3 bucket (origin for CloudFront, no public access)
 * - CloudFront distribution with Origin Access Control (OAC)
 * - Route53 A + AAAA alias records pointing to CloudFront
 * - www.ellevas.dev redirects to ellevas.dev (via CloudFront function)
 */
export class HostingStack extends Stack {
  /** S3 bucket name — used by GitHubActionsStack for IAM policy scoping */
  public readonly siteBucketName: string;
  /** CloudFront distribution ID — used for IAM policy and cache invalidation */
  public readonly distributionId: string;

  constructor(scope: Construct, id: string, props: HostingStackProps) {
    super(scope, id, props);

    // ─── S3 Bucket (private, CloudFront-only access) ───────────────────

    const siteBucket = new s3.Bucket(this, 'SiteBucket', {
      bucketName: `${DOMAIN_NAME}-site-assets`,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      encryption: s3.BucketEncryption.S3_MANAGED,
      versioned: true,
      lifecycleRules: [
        {
          noncurrentVersionExpiration: Duration.days(5),
        },
      ],
      removalPolicy: RemovalPolicy.RETAIN,
      autoDeleteObjects: false,
    });

    // ─── CloudFront Distribution ───────────────────────────────────────

    const certificate = acm.Certificate.fromCertificateArn(
      this,
      'ImportedCertificate',
      props.certificateArn,
    );

    // CloudFront Function to handle www→apex redirect and subdirectory index rewriting
    const requestHandlerFunction = new cloudfront.Function(this, 'RequestHandlerFunction', {
      code: cloudfront.FunctionCode.fromInline(`
        function handler(event) {
          var request = event.request;
          var host = request.headers.host.value;
          var uri = request.uri;

          // Redirect www → apex
          if (host.startsWith('www.')) {
            return {
              statusCode: 301,
              statusDescription: 'Moved Permanently',
              headers: {
                location: { value: 'https://${DOMAIN_NAME}' + uri }
              }
            };
          }

          // Rewrite subdirectory requests to serve index.html
          // e.g. /docs → /docs/index.html, /it/ → /it/index.html
          if (uri.endsWith('/')) {
            request.uri = uri + 'index.html';
          } else if (!uri.includes('.')) {
            request.uri = uri + '/index.html';
          }

          return request;
        }
      `),
      functionName: 'ellevas-request-handler',
    });

    const distribution = new cloudfront.Distribution(this, 'SiteDistribution', {
      defaultBehavior: {
        origin: origins.S3BucketOrigin.withOriginAccessControl(siteBucket),
        viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
        functionAssociations: [
          {
            function: requestHandlerFunction,
            eventType: cloudfront.FunctionEventType.VIEWER_REQUEST,
          },
        ],
      },
      domainNames: [DOMAIN_NAME, WWW_DOMAIN],
      certificate,
      defaultRootObject: 'index.html',
      errorResponses: [
        {
          httpStatus: 404,
          responseHttpStatus: 404,
          responsePagePath: '/404.html',
        },
        {
          httpStatus: 403,
          responseHttpStatus: 404,
          responsePagePath: '/404.html',
        },
      ],
      minimumProtocolVersion: cloudfront.SecurityPolicyProtocol.TLS_V1_2_2021,
      httpVersion: cloudfront.HttpVersion.HTTP2_AND_3,
    });

    // ─── Route53 DNS Records ───────────────────────────────────────────

    const hostedZone = route53.HostedZone.fromLookup(this, 'HostedZone', {
      domainName: DOMAIN_NAME,
    });

    const distributionTarget = new route53Targets.CloudFrontTarget(distribution);

    // Apex domain (ellevas.dev)
    new route53.ARecord(this, 'ApexARecord', {
      zone: hostedZone,
      target: route53.RecordTarget.fromAlias(distributionTarget),
    });

    new route53.AaaaRecord(this, 'ApexAaaaRecord', {
      zone: hostedZone,
      target: route53.RecordTarget.fromAlias(distributionTarget),
    });

    // www subdomain
    new route53.ARecord(this, 'WwwARecord', {
      zone: hostedZone,
      recordName: 'www',
      target: route53.RecordTarget.fromAlias(distributionTarget),
    });

    new route53.AaaaRecord(this, 'WwwAaaaRecord', {
      zone: hostedZone,
      recordName: 'www',
      target: route53.RecordTarget.fromAlias(distributionTarget),
    });

    // ─── Outputs ───────────────────────────────────────────────────────

    this.siteBucketName = siteBucket.bucketName;
    this.distributionId = distribution.distributionId;

    new CfnOutput(this, 'BucketName', {
      value: siteBucket.bucketName,
      description: 'S3 bucket for site assets',
    });

    new CfnOutput(this, 'DistributionId', {
      value: distribution.distributionId,
      description: 'CloudFront distribution ID (needed for cache invalidation)',
    });

    new CfnOutput(this, 'DistributionDomain', {
      value: distribution.distributionDomainName,
      description: 'CloudFront distribution domain name',
    });
  }
}
