import axios from 'axios';

export interface MLTrainingRequest {
  data_blob_ids: string[];
  model_config_blob_id: string;
  key_id: string;
  learning_rate: number;
  epochs: number;
}

export interface MLTrainingResponse {
  model_blob_id: string;
  accuracy: number;
  final_loss: number;
  num_samples: number;
  model_hash: number[];
}

export interface ProcessedDataResponse {
  response: {
    payload: MLTrainingResponse;
    timestamp_ms: number;
  };
  signature: string;
}

export async function callNautilusTraining(
  payload: MLTrainingRequest
): Promise<ProcessedDataResponse> {
  const { data } = await axios.post(
    `http://NAUTILUS_IP:3000/process_data`,
    { payload },
    { headers: { 'Content-Type': 'application/json' } }
  );

  return data;
}
