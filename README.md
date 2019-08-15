# ECS EC2 Autoscaling Sample

A simple lab demonstrating autoscaling of ECS tasks and ECS container instances in tandem.

## Disclaimer

This project is made for educational and testing purposes only, it is not indented to be used in a production environment.

## Getting Started

### Prerequisites

Run the following commands to deploy the Stack in your AWS account:
1. `npm install -g aws-cdk` - install the AWS CDK CLI tool
2. `npm install` - install the dependencies
3. `cdk deploy` - deploy the stack

### Load test
To start the load test run the following command:
 ```
 ALB_DNS=XXX node_modules/artillery/bin/artillery run load_test.yml
```
Where `ALB_DNS` is the DNS of the load balancer created by the stack.

NB. The load test will take 20 minutes to complete and the autoscaling operations will start at the 5 minute mark.

## License

This project is licensed under the MIT License.

