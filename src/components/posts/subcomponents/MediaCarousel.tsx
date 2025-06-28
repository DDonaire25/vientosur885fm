import React, { useState, useEffect } from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';

export interface MediaItem {
  url: string;
  type: 'image' | 'video';
  aspectRatio?: '1:1' | '4:5' | '1.91:1';
  name?: string;
}

interface MediaCarouselProps {
  media: MediaItem[];
  onOpenLightbox?: (idx: number) => void;
  currentIndex?: number;
}

const MediaCarousel: React.FC<MediaCarouselProps> = ({ media, onOpenLightbox }) => {
  return (
    <Swiper
      modules={[Navigation, Pagination]}
      navigation
      pagination={{ clickable: true }}
      style={{ display: 'inline-block', width: 'auto', height: 'auto', maxWidth: '100%', maxHeight: '80vh', margin: '0 auto', background: 'transparent', padding: 0 }}
    >
      {media.map((item, idx) => (
        <SwiperSlide key={item.url} style={{padding: 0, margin: 0, background: 'transparent', display: 'flex', justifyContent: 'center', alignItems: 'center', width: 'auto', height: 'auto', maxWidth: '100%', maxHeight: '80vh'}}>
          {item.type === 'image' ? (
            <div style={{ display: 'inline-block', width: 'auto', height: 'auto', maxWidth: '100%', maxHeight: '80vh', background: 'transparent' }}>
              <img
                src={item.url}
                alt={`Imagen ${idx + 1}`}
                style={{ width: '100%', height: '100%', maxWidth: '470px', maxHeight: '80vh', objectFit: 'contain', border: 'none', borderRadius: 0, background: 'transparent', display: 'block', margin: 0, padding: 0 }}
                onClick={() => onOpenLightbox && onOpenLightbox(idx)}
              />
            </div>
          ) : item.type === 'video' ? (
            <video
              src={item.url}
              controls
              className={`w-full object-cover`}
              style={{ border: 'none', borderRadius: 0, background: 'transparent', margin: 0, padding: 0, maxHeight: '80vh', maxWidth: '470px' }}
            />
          ) : null}
        </SwiperSlide>
      ))}
    </Swiper>
  );
};

export default MediaCarousel;
