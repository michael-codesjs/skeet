import { gql } from '@apollo/client';

export const CREATE_MEDIA = gql`
  mutation CreateMedia($projectId: String!, $files: [MediaUploadInput!]!) {
    createMedia(projectId: $projectId, files: $files) {
      id
      uploadUrl
    }
  }
`;

export const CONFIRM_MEDIA_UPLOADS = gql`
  mutation ConfirmMediaUploads($projectId: String!, $ids: [String!]!) {
    confirmMediaUploads(projectId: $projectId, ids: $ids)
  }
`;
