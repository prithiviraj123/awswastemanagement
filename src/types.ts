export type AWSResourceType = 'EC2' | 'RDS' | 'EBS' | 'SNAPSHOT';

export interface AWSResource {
  id: string;
  type: AWSResourceType;
  name: string;
  region: string;
  state: string;
  lastUsed: string;
  cost: number;
  details: {
    instanceType?: string;    // For EC2 and RDS
    volumeSize?: number;      // For EBS (in GB)
    snapshotSize?: number;    // For snapshots (in GB)
    engine?: string;          // For RDS (e.g., mysql, postgres)
    volumeType?: string;      // For EBS (e.g., gp2, io1)
  };
}

export interface ResourceResponse {
  resources: AWSResource[];
  error?: string;
}

export interface ResourceTypeCount {
  type: AWSResourceType;
  count: number;
  totalCost: number;
}