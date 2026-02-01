import { gql } from '@apollo/client';

export const GET_PROJECTS = gql`
  query GetProjects {
    projects {
      id
      title
      createdAt
      status
      media {
        thumbnail
      }
    }
  }
`;

// Core project data for initial load (Timeline, Settings, etc.)
export const GET_PROJECT_DETAILS = gql`
  query GetProjectDetails($id: String!) {
    project(id: $id) {
      id
      title
      description
      createdAt
      status
      finalVideoUrl
      otio
    }
  }
`;

// Media-specific query for the sidebar (Search/Filter support)
export const GET_PROJECT_MEDIA = gql`
  query GetProjectMedia($projectId: String!, $search: String, $type: String) {
    project(id: $projectId) {
      id
      media(search: $search, type: $type) {
        id
        fileName
        status
        s3Key
        thumbnail
        tags
        summary
        shotBreakdown
        duration
        videoUrl
        proxyUrl
        mimeType
      }
    }
  }
`;
