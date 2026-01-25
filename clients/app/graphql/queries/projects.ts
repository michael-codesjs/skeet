import { gql } from '@apollo/client';

export const GET_PROJECTS = gql`
  query GetProjects {
    projects {
      id
      title
      createdAt
      status
      clips {
        thumbnail
      }
    }
  }
`;

export const GET_PROJECT = gql`
  query GetProject($id: String!) {
    project(id: $id) {
      id
      title
      prompt
      createdAt
      status
      finalVideoUrl
      editJson
      clips {
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
      }
    }
  }
`;
