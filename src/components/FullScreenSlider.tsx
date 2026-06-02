'use client';
import Image from 'next/image';
import { Swiper, SwiperSlide } from 'swiper/react';
import { EffectFade, Pagination, Autoplay } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/effect-fade';
import 'swiper/css/pagination';

const slides = [
  { id: 1, background: '/login-slide-1.png', alt: 'Login background slide 1' },
  { id: 2, background: '/login-slide-2.png', alt: 'Login background slide 2' },
  { id: 3, background: '/login-slide-3.png', alt: 'Login background slide 3' },
];

const FullScreenSlider = () => {
  return (
    <div className="absolute inset-0 w-full h-full">
      <Swiper
        modules={[EffectFade, Pagination, Autoplay]}
        effect="fade"
        fadeEffect={{ crossFade: true }}
        pagination={{
          clickable: true,
          bulletClass: 'swiper-pagination-bullet',
          bulletActiveClass: 'swiper-pagination-bullet-active',
        }}
        autoplay={{
          delay: 5000,
          disableOnInteraction: false,
        }}
        loop={true}
        speed={1000}
        className="w-full h-full fullscreen-swiper"
      >
        {slides.map((slide) => (
          <SwiperSlide key={slide.id}>
            <div className="relative w-full h-full">
              <Image
                src={slide.background}
                alt={slide.alt}
                fill
                className="object-cover"
                priority={slide.id === 1}
                sizes="100vw"
              />
            </div>
          </SwiperSlide>
        ))}
      </Swiper>
    </div>
  );
};

export default FullScreenSlider;
