# ECS EC2 Autoscaling Sample

Simple demo showing autoscaling of ECS Tasks and Container Instances in tandem.

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

The load test sends 20 RPS to two different services. To simulate different levels of CPU load, the first service generates the 42nd fibonacci number, and the second service generates the 34th.

NB. The load test will take 20 minutes to complete and the autoscaling operations will start at the 5 minute mark.

## License

This project is licensed under the MIT License.

