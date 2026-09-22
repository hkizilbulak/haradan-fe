export type LocalImageFile = {
  uri: string;
  mimeType: string;
  fileName: string;
  file?: File;
};

export type UploadedMedia = {
  assetId: string;
  publicUrl: string;
};

/** POST /v1/media — UI bu arayüze bağlıdır. */
export interface IMediaUploader {
  upload(file: LocalImageFile, accessToken: string): Promise<UploadedMedia>;
}
