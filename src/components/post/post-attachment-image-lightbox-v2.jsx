import { useEffect, useRef } from 'react';
import PhotoSwipe from 'photoswipe';
import PhotoSwipeLightbox from 'photoswipe/lightbox';

/** @typedef {import('photoswipe/lightbox').default} PhotoSwipeLightbox */
/** @typedef {import('photoswipe').DataSourceArray} DataSourceArray */
/** @typedef {import('photoswipe').PhotoSwipeOptions} PhotoSwipeOptions */

/** @type {Readonly<PhotoSwipeOptions>} */
const psDefaultOptions = {
  clickToCloseNonZoomable: false,
  bgOpacity: 0.8,
  pswpModule: PhotoSwipe,
};

/**
 * @typedef ImageAttachmentsLightboxV2Props
 * @property {Readonly<DataSourceArray>} items
 * @property {string} [postId]
 * @property {number} index
 * @property {(index: number) => HTMLImageElement | undefined} getThumbnail
 * @property {() => void} onDestroy
 */

/**
 * @param {ImageAttachmentsLightboxV2Props} props
 */
const ImageAttachmentsLightboxV2 = ({ items: originalItems, index, postId, getThumbnail, onDestroy }) => {
  const psRef = useRef(/** @type {PhotoSwipeLightbox | null} **/ null);

  useEffect(() => {
    psRef.current = new PhotoSwipeLightbox({ ...psDefaultOptions });
    psRef.current.init();

    return () => {
      psRef.current.destroy();
      psRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!onDestroy) {
      return;
    }

    psRef.current?.on('destroy', onDestroy);
    return () => psRef.current?.off('destroy', onDestroy);
  }, [onDestroy]);

  useEffect(() => {
    if (!psRef.current) {
      return;
    }

    /** @type {DataSourceArray} */
    const items = originalItems.map((originalItem, idx) => {
      const item = { ...originalItem };
      const thumb = getThumbnail(idx);

      if (!item.msrc) {
        item.msrc = thumb?.currentSrc ?? undefined;
      }

      // Convert dropbox page URL to image URL
      if (item.src) {
        item.src = item.src.replace(
          'https://www.dropbox.com/s/',
          'https://dl.dropboxusercontent.com/s/',
        );
      }

      if (item.w) {
        return item;
      }

      // dimensions for the old images without sizes
      item.w = 800;
      item.h = 600;

      // trying to get aspect ratio from thumbnail
      const rect = thumb?.getBoundingClientRect();
      if (rect?.width) {
        item.h = (rect.height * item.w) / rect.width;
        return item;
      }

      // trying to get size by loading image
      if (item.src) {
        item.w = 1;
        item.h = 1;

        const image = new Image();
        image.onload = () => {
          // using captured `item` to patch the correct object, and make it only once
          item.w = image.width;
          item.h = image.height;
          psRef.current?.refreshSlideContent(psRef.current?.currSlide.index);
          psRef.current?.updateSize(true);
        };
        image.src = item.src;
      }

      return item;
    });

    psRef.current.loadAndOpen(0, items);
  }, [originalItems, getThumbnail]);

  useEffect(() => {
    psRef.current?.loadAndOpen(index);
  }, [index]);

  return null;
};

export default ImageAttachmentsLightboxV2;
