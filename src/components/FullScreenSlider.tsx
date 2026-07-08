'use client';
import Image from 'next/image';
import { Swiper, SwiperSlide } from 'swiper/react';
import { EffectFade, Pagination, Autoplay } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/effect-fade';
import 'swiper/css/pagination';

// sky: vertical gradient sampled from each image's right edge, so the CSS
// backdrop blends seamlessly where the image ends.
// height/top: sized per slide so the machine's lowest dark pixel lands at
// ~71% of the viewport — just clear of the heading text at 76.67%.
const slides = [
  {
    id: 1,
    background: '/login-slide-1.png',
    alt: 'Login background slide 1',
    aspect: '1248 / 832',
    height: '113.2%',
    top: '-9.4%',
    sky: 'linear-gradient(180deg, #61cafc 0%, #b6e6fc 25%, #fffefe 50%, #fefefe 100%)',
  },
  {
    id: 2,
    background: '/login-slide-2.png',
    alt: 'Login background slide 2',
    aspect: '2432 / 1664',
    height: '100%',
    top: '-1%',
    sky: 'linear-gradient(180deg, #68c7f5 0%, #87d1f4 25%, #bae3f5 50%, #e0f1f9 75%, #fbfbf9 100%)',
  },
  {
    id: 3,
    background: '/login-slide-3.png',
    alt: 'Login background slide 3',
    aspect: '2432 / 1664',
    height: '113.2%',
    top: '-15%',
    sky: 'linear-gradient(180deg, #67ccfa 0%, #b0e2f9 25%, #f9f9f7 50%, #fafafa 100%)',
  },
];

const FullScreenSlider = () => {
  return (
    <div className="absolute inset-0 w-full h-full">
      <Swiper
        modules={[EffectFade, Pagination, Autoplay]}
        effect="fade"
        fadeEffect={{ crossFade: true }}
        pagination={{
          el: '.login-slider-pagination',
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
            <div className="relative w-full h-full overflow-hidden" style={{ background: slide.sky }}>
              {/* Figma places the 1086px-tall art in the 960px frame (113.2%),
                  slightly above center — the image keeps its aspect ratio and is
                  never cropped vertically, so the machine always stays intact */}
              <div
                className="absolute left-1/2 -translate-x-1/2 [mask-image:linear-gradient(to_right,transparent_0%,black_6%,black_94%,transparent_100%)] [-webkit-mask-image:linear-gradient(to_right,transparent_0%,black_6%,black_94%,transparent_100%)]"
                style={{ aspectRatio: slide.aspect, height: slide.height, top: slide.top }}
              >
                <Image
                  src={slide.background}
                  alt={slide.alt}
                  fill
                  className="object-contain"
                  priority={slide.id === 1}
                  sizes="100vw"
                />
              </div>
            </div>
          </SwiperSlide>
        ))}
      </Swiper>
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-32 bg-gradient-to-b from-transparent to-white z-[5]" />
      <div className="login-slider-pagination" />
    </div>
  );
};

export default FullScreenSlider;
