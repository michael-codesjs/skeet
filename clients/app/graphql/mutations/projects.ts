import { gql } from '@apollo/client';

export const CREATE_PROJECT = gql`
  mutation CreateProject($title: String, $description: String!) {
    createProject(title: $title, description: $description) {
      id
      title
      description
    }
  }
`;

export const UPDATE_PROJECT = gql`
  mutation UpdateProject($id: String!, $title: String, $description: String) {
    updateProject(id: $id, title: $title, description: $description) {
      id
      title
      description
    }
  }
`;

export const REQUEST_VIDEO_UPLOAD_URLS = gql`
  mutation RequestVideoUploadUrls($projectId: String!, $files: [VideoUploadInput!]!) {
    requestVideoUploadUrls(projectId: $projectId, files: $files) {
      uploadUrl
      key
      fileName
    }
  }
`;

export const CONFIRM_VIDEO_UPLOADS = gql`
  mutation ConfirmVideoUploads($projectId: String!, $files: [VideoConfirmInput!]!) {
    confirmVideoUploads(projectId: $projectId, files: $files) {
      id
      fileName
      status
    }
  }
`;

export const DELETE_VIDEO_FILE = gql`
  mutation DeleteVideoFile($id: String!) {
    deleteVideoFile(id: $id) {
      id
    }
  }
`;

export const GENERATE_SKEET = gql`
  mutation GenerateSkeet(
    $id: String!
    $pacing: String
    $intensity: String
    $musicStyle: String
    $focusSubject: String
  ) {
    generateSkeet(
      id: $id
      pacing: $pacing
      intensity: $intensity
      musicStyle: $musicStyle
      focusSubject: $focusSubject
    ) {
      id
      status
    }
  }
`;

export const REANALYZE_PROJECT_ASSETS = gql`
  mutation ReanalyzeProjectAssets($id: String!) {
    reanalyzeProjectAssets(id: $id) {
      id
    }
  }
`;

// NEW MUTATIONS FOR STUDIO
export const GENERATE_PROJECT_DRAFT = gql`
  mutation GenerateProjectDraft($id: String!, $vibe: String!, $pacing: String) {
    generateProjectDraft(id: $id, vibe: $vibe, pacing: $pacing) {
      id
      status
      otio
    }
  }
`;

export const UPDATE_PROJECT_DRAFT = gql`
  mutation UpdateProjectDraft($id: String!, $editJson: String!) {
    updateProjectDraft(id: $id, editJson: $editJson) {
      id
      otio
    }
  }
`;

export const AI_EDIT_PROJECT_DRAFT = gql`
  mutation AiEditProjectDraft($id: String!, $instruction: String!) {
    aiEditProjectDraft(id: $id, instruction: $instruction) {
      id
      otio
    }
  }
`;

export const EXPORT_PROJECT_VIDEO = gql`
  mutation ExportProjectVideo($id: String!) {
    exportProjectVideo(id: $id) {
      id
      status
    }
  }
`;
