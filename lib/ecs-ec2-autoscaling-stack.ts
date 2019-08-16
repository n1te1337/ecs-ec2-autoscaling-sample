import * as cdk from '@aws-cdk/core';
import { Vpc, InstanceType } from '@aws-cdk/aws-ec2';
import { AutoScalingGroup } from '@aws-cdk/aws-autoscaling';
import * as elb from '@aws-cdk/aws-elasticloadbalancingv2';
import * as ecs from '@aws-cdk/aws-ecs';


export class EcsEc2AutoscalingStack extends cdk.Stack {
  readonly STACK_NAME = 'ecs-ec2-autoscaling';

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
      clusterName: this.STACK_NAME,
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

    const service1 = this.createService(cluster, 'service-1')
    listener.addTargets('web-service-1', { 
      priority: 1,
      hostHeader: 'web-1.com',
      port: 80 ,
      healthCheck: { path: '/api/v2/health' },
      targets: [service1],
    });

    const service2 = this.createService(cluster, 'service-2')
    listener.addTargets('web-service-2', { 
      priority: 2,
      hostHeader: 'web-2.com',
      port: 80 ,
      healthCheck: { path: '/api/v2/health' },
      targets: [service2],
    });
  }

  private createService(cluster: ecs.ICluster, id: string): ecs.BaseService {
    const taskDefinition = new ecs.Ec2TaskDefinition(this, `${id}-task-definition`);

    const container = taskDefinition.addContainer('web', {
      image: ecs.ContainerImage.fromRegistry('legdba/servicebox-nodejs'),
      memoryLimitMiB: 256,
      cpu: 128,
      logging: new ecs.AwsLogDriver({ streamPrefix: `${this.STACK_NAME}-${id}` }),
    });
    container.addPortMappings({
      containerPort: 8080,
    });
  
    const service = new ecs.Ec2Service(this, id, {
      serviceName: `${this.STACK_NAME}-${id}`,
      cluster,
      taskDefinition,
    });
    
    const scaling = service.autoScaleTaskCount({ 
      minCapacity: 2,
      maxCapacity: 1000,
    });
    scaling.scaleOnCpuUtilization(`${id}-cpu-task-scaling`, {
      targetUtilizationPercent: 50,
      scaleInCooldown: cdk.Duration.seconds(30),
      scaleOutCooldown: cdk.Duration.seconds(30),
    });

    return service;
  }
}
