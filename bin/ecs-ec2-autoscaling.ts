#!/usr/bin/env node
import 'source-map-support/register';
import cdk = require('@aws-cdk/core');
import { EcsEc2AutoscalingStack } from '../lib/ecs-ec2-autoscaling-stack';

const app = new cdk.App();
new EcsEc2AutoscalingStack(app, 'EcsEc2AutoscalingStack');
