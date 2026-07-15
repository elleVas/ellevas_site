import { Stack, type StackProps } from 'aws-cdk-lib';
import * as budgets from 'aws-cdk-lib/aws-budgets';
import type { Construct } from 'constructs';

export interface BudgetStackProps extends StackProps {
  /** Email address to receive budget alerts */
  alertEmail: string;
}

/**
 * BudgetStack
 *
 * Creates an AWS Budget with email alerts at $1 and $5 thresholds.
 * This costs $0 — it's a monitoring-only resource.
 */
export class BudgetStack extends Stack {
  constructor(scope: Construct, id: string, props: BudgetStackProps) {
    super(scope, id, props);

    new budgets.CfnBudget(this, 'MonthlyCostBudget', {
      budget: {
        budgetName: 'ellevas-site-monthly',
        budgetType: 'COST',
        timeUnit: 'MONTHLY',
        budgetLimit: {
          amount: 5,
          unit: 'USD',
        },
        costFilters: {
          TagKeyValue: ['user:Project$ellevas-site'],
        },
        costTypes: {
          includeTax: true,
          includeSubscription: true,
          includeRecurring: true,
          includeOtherSubscription: true,
          includeSupport: false,
          includeDiscount: true,
          includeCredit: false,
          includeRefund: false,
          includeUpfront: true,
          useAmortized: false,
          useBlended: false,
        },
      },
      notificationsWithSubscribers: [
        {
          notification: {
            notificationType: 'ACTUAL',
            comparisonOperator: 'GREATER_THAN',
            threshold: 20,
            thresholdType: 'PERCENTAGE',
          },
          subscribers: [
            { subscriptionType: 'EMAIL', address: props.alertEmail },
          ],
        },
        {
          notification: {
            notificationType: 'ACTUAL',
            comparisonOperator: 'GREATER_THAN',
            threshold: 100,
            thresholdType: 'PERCENTAGE',
          },
          subscribers: [
            { subscriptionType: 'EMAIL', address: props.alertEmail },
          ],
        },
      ],
    });
  }
}
