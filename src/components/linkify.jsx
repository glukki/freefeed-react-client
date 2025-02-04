import cn from 'classnames';
import { cloneElement, isValidElement, useMemo, useRef } from 'react';

import { parseText } from '../utils/parse-text';
import { highlightString } from '../utils/search-highlighter';
import { EndSpoiler, StartSpoiler } from '../utils/spoiler-tokens';

import ErrorBoundary from './error-boundary';
import { tokenToElement } from './linkify-elements';
import Spoiler from './spoiler';
import UserName from './user-name';

export default function Linkify({
  children,
  className,
  showMedia,
  userHover,
  arrowHover,
  arrowClick,
  highlightTerms: hl = [],
}) {
  const attachmentsRef = useRef([]);

  const formatted = useMemo(() => {
    // attachmentsRef.current.length = 0;
    let fm = processStrings(children, parseString, ['a', 'button', UserName], {
      showMedia,
      userHover,
      arrowHover,
      arrowClick,
      attachmentsRef,
    });
    if (hl.length > 0) {
      fm = processStrings(fm, (str) => highlightString(str, hl), ['button']);
    }
    return fm;
  }, [arrowClick, arrowHover, children, hl, showMedia, userHover]);

  return (
    <span className={cn('Linkify', className)} dir="auto" role="region">
      <ErrorBoundary>{formatted}</ErrorBoundary>
    </span>
  );
}

/**
 * Recursive process text content of React children
 *
 * @param {import('react').ReactChildren | import('react').ReactNode} children
 * @param {(text: string, params: object) => string} processor
 * @param {string[]} excludeTags
 * @param {object} params
 * @returns {import('react').ReactNode[]}
 */
function processStrings(children, processor, excludeTags = [], params = {}) {
  if (typeof children === 'string') {
    return processor(children, params);
  } else if (isValidElement(children) && !excludeTags.includes(children.type)) {
    return cloneElement(
      children,
      {},
      processStrings(children.props.children, processor, excludeTags, params),
    );
  } else if (Array.isArray(children)) {
    return children.map((ch) => processStrings(ch, processor, excludeTags, params));
  }
  return children;
}

function parseString(text, params) {
  if (text === '') {
    return [];
  }

  const tokens = parseText(text);
  const spoilerContent = [];
  const resultContent = [];
  let result = resultContent;

  for (const [index, token] of tokens.entries()) {
    if (token instanceof StartSpoiler) {
      result.push(tokenToElement(token, index, params));
      result = spoilerContent;
    } else if (token instanceof EndSpoiler) {
      const content = [...spoilerContent];
      spoilerContent.length = 0;
      result = resultContent;

      result.push(<Spoiler key={index}>{content}</Spoiler>);
      result.push(tokenToElement(token, index, params));
    } else {
      result.push(tokenToElement(token, index, params));
    }
  }
  return resultContent;
}
