import { Stack, type StackProps, CfnOutput } from 'aws-cdk-lib';
import * as acm from 'aws-cdk-lib/aws-certificatemanager';
import * as route53 from 'aws-cdk-lib/aws-route53';
import type { Construct } from 'constructs';
import { DOMAIN_NAME, WWW_DOMAIN } from './config.js';

/**
 * DnsCertificateStack
 *
 * Creates an ACM certificate for the apex and www subdomain,
 * validated automatically via DNS records in the existing Route53 Hosted Zone.
 *
 * This stack MUST be deployed in us-east-1 because CloudFront
 * only accepts certificates from that region.
 */
export class DnsCertificateStack extends Stack {
  /** The validated certificate, consumed by the HostingStack */
  public readonly certificate: acm.ICertificate;

  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    // Look up the existing Hosted Zone created by Route53 domain registration
    const hostedZone = route53.HostedZone.fromLookup(this, 'HostedZone', {
      domainName: DOMAIN_NAME,
    });

    // TLS certificate covering both apex and www
    this.certificate = new acm.Certificate(this, 'SiteCertificate', {
      domainName: DOMAIN_NAME,
      subjectAlternativeNames: [WWW_DOMAIN],
      validation: acm.CertificateValidation.fromDns(hostedZone),
    });

    // Export the certificate ARN for cross-stack / cross-region reference
    new CfnOutput(this, 'CertificateArn', {
      value: this.certificate.certificateArn,
      description: 'ACM certificate ARN for CloudFront (us-east-1)',
      exportName: 'EllevasSiteCertificateArn',
    });
  }
}
