import { Global, css } from '@emotion/react';
import type { Theme } from './theme';

interface GlobalStylesProps {
  theme: Theme;
}

export const GlobalStyles = ({ theme }: GlobalStylesProps) => (
  <Global
    styles={css`
      /* Reset */
      *,
      *::before,
      *::after {
        box-sizing: border-box;
        margin: 0;
        padding: 0;
      }

      /* Root */
      :root {
        color-scheme: light;
      }

      /* HTML & Body */
      html {
        font-size: 16px;
        -webkit-font-smoothing: antialiased;
        -moz-osx-font-smoothing: grayscale;
      }

      body {
        font-family: ${theme.typography.fontFamily.sans};
        font-size: ${theme.typography.fontSize.base};
        line-height: ${theme.typography.lineHeight.normal};
        color: ${theme.colors.text.primary};
        background: ${theme.gradients.background};
        background-attachment: fixed;
        min-height: 100vh;
      }

      /* Links */
      a {
        color: ${theme.colors.primary[600]};
        text-decoration: none;
        transition: color ${theme.transitions.fast};

        &:hover {
          color: ${theme.colors.primary[700]};
        }
      }

      /* Buttons */
      button {
        font-family: inherit;
        cursor: pointer;
        border: none;
        background: none;
      }

      /* Inputs */
      input,
      textarea,
      select {
        font-family: inherit;
        font-size: inherit;
      }

      /* Lists */
      ul,
      ol {
        list-style: none;
      }

      /* Images */
      img {
        max-width: 100%;
        height: auto;
        display: block;
      }

      /* Scrollbar */
      ::-webkit-scrollbar {
        width: 8px;
        height: 8px;
      }

      ::-webkit-scrollbar-track {
        background: ${theme.colors.gray[100]};
      }

      ::-webkit-scrollbar-thumb {
        background: ${theme.colors.gray[300]};
        border-radius: ${theme.radius.full};

        &:hover {
          background: ${theme.colors.gray[400]};
        }
      }

      /* Selection */
      ::selection {
        background: ${theme.colors.primary[500]};
        color: white;
      }

      /* Focus */
      :focus-visible {
        outline: 2px solid ${theme.colors.primary[500]};
        outline-offset: 2px;
      }

      /* Utility Classes */
      .sr-only {
        position: absolute;
        width: 1px;
        height: 1px;
        padding: 0;
        margin: -1px;
        overflow: hidden;
        clip: rect(0, 0, 0, 0);
        white-space: nowrap;
        border: 0;
      }
    `}
  />
);
