import * as cdk from '@aws-cdk/core';
import { Vpc, InstanceType } from '@aws-cdk/aws-ec2';
import { AutoScalingGroup } from '@aws-cdk/aws-autoscaling';
import * as elb from '@aws-cdk/aws-elasticloadbalancingv2';
import * as ecs from '@aws-cdk/aws-ecs';

const STACK_NAME = 'ecs-ec2-autoscaling';

export class EcsEc2AutoscalingStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const vpc = new Vpc(this, 'vpc', {
      cidr: '10.0.0.0/16',
    });

    const lb = new elb.ApplicationLoadBalancer(this, 'alb', {
      vpc,
      internetFacing: true,
    });

    const listener = lb.addListener('listener', {
      port: 80,
      open: true,
    });
    listener.addTargetGroups('black-hole-target', {
      targetGroups: [ 
        new elb.ApplicationTargetGroup(this, 'black-hole-target', {
          vpc: vpc,
          protocol: elb.ApplicationProtocol.HTTP,
          port: 80,
        })
      ]
    });

    const cluster = new ecs.Cluster(this, 'cluster', {
      clusterName: STACK_NAME,
      vpc,
    });

    const asg = new AutoScalingGroup(this, 'asg', {
      vpc,
      instanceType: new InstanceType('t2.large'),
      machineImage: ecs.EcsOptimizedImage.amazonLinux(),
      minCapacity: 3,
      maxCapacity: 20,
      cooldown: cdk.Duration.seconds(60),
    });
    asg.scaleOnCpuUtilization('cpu-instance-scaling', { 
      targetUtilizationPercent: 60,
    })
    
    cluster.addAutoScalingGroup(asg);

    const taskDefinition = new ecs.Ec2TaskDefinition(this, 'web-task-definition');

    const container = taskDefinition.addContainer('web', {
      image: ecs.ContainerImage.fromRegistry('legdba/servicebox-nodejs'),
      memoryLimitMiB: 256,
      cpu: 128,
      logging: new ecs.AwsLogDriver({ streamPrefix: `${STACK_NAME}-web` }),
    });
    container.addPortMappings({
      containerPort: 8080,
    });
  
    const service = new ecs.Ec2Service(this, 'web-service', {
      serviceName: `${STACK_NAME}-web-service`,
      cluster,
      taskDefinition,
    });
    
    const scaling = service.autoScaleTaskCount({ 
      minCapacity: 2,
      maxCapacity: 1000,
    });
    scaling.scaleOnCpuUtilization('cpu-task-scaling', {
      targetUtilizationPercent: 50,
      scaleInCooldown: cdk.Duration.seconds(30),
      scaleOutCooldown: cdk.Duration.seconds(30),
    });

    listener.addTargets('web-service', { 
      priority: 1,
      hostHeader: 'example.com',
      port: 80 ,
      healthCheck: { path: '/api/v2/health' },
      targets: [service],
    });
  }
}
