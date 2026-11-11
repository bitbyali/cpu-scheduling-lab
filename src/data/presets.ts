import { PresetScenario } from '../types/scheduling';

export const PROCESS_COLORS: readonly string[] = [
  '#38BDF8', // P1: آبی آسمانی
  '#10B981', // P2: سبز زمردی
  '#F59E0B', // P3: کهربایی
  '#A855F7', // P4: بنفش
  '#F43F5E', // P5: مرجانی
  '#06B6D4', // P6: فیروزه‌ای
  '#84CC16', // P7: لیمویی
  '#EC4899', // P8: سرخابی
];

export function getProcessColor(index: number): string {
  return PROCESS_COLORS[index % PROCESS_COLORS.length];
}

export const PRESET_SCENARIOS: PresetScenario[] = [
  {
    id: 'reference-class-example',
    title: '۱. مثال مرجع ارائه دانشگاهی (استاندارد کلاس)',
    badge: 'مثال مرجع ارائه',
    educationalPoint:
      'سه پردازش P1(0,5)، P2(1,3) و P3(2,2) با کوانتوم ۲؛ در این سناریو میانگین زمان پاسخ (RT) در Round Robin از ۳.۳۳ به ۱.۰۰ کاهش می‌یابد و پردازش کوتاه P3 در لحظه ۶ (به‌جای ۱۰ در FCFS) تکمیل می‌شود.',
    recommendedQuantum: 2,
    processes: [
      { pid: 'P1', arrivalTime: 0, burstTime: 5, color: PROCESS_COLORS[0] },
      { pid: 'P2', arrivalTime: 1, burstTime: 3, color: PROCESS_COLORS[1] },
      { pid: 'P3', arrivalTime: 2, burstTime: 2, color: PROCESS_COLORS[2] },
    ],
  },
  {
    id: 'convoy-effect',
    title: '۲. پدیده اثر قطار (Convoy Effect در FCFS)',
    badge: 'اثر قطار',
    educationalPoint:
      'یک پردازش طولانی P1(0,12) در ابتدای صف و سه پردازش کوتاه ۱ و ۲ واحدی پشت سر آن؛ در FCFS پردازش‌های کوتاه پشت P1 قفل می‌شوند اما در Round Robin در همان چرخه اول پاسخ می‌گیرند.',
    recommendedQuantum: 2,
    processes: [
      { pid: 'P1', arrivalTime: 0, burstTime: 12, color: PROCESS_COLORS[0] },
      { pid: 'P2', arrivalTime: 1, burstTime: 1, color: PROCESS_COLORS[1] },
      { pid: 'P3', arrivalTime: 2, burstTime: 2, color: PROCESS_COLORS[2] },
      { pid: 'P4', arrivalTime: 3, burstTime: 1, color: PROCESS_COLORS[3] },
    ],
  },
  {
    id: 'simultaneous-arrival',
    title: '۳. ورود هم‌زمان در لحظه صفر (سیستم تعاملی)',
    badge: 'ورود هم‌زمان',
    educationalPoint:
      'چهار پردازش که همگی در لحظه t=0 آماده اجرا هستند؛ نمایش چرخش نوبتی منظم در Round Robin در مقایسه با اجرای ترتیبی یک‌طرفه در FCFS.',
    recommendedQuantum: 2,
    processes: [
      { pid: 'P1', arrivalTime: 0, burstTime: 6, color: PROCESS_COLORS[0] },
      { pid: 'P2', arrivalTime: 0, burstTime: 4, color: PROCESS_COLORS[1] },
      { pid: 'P3', arrivalTime: 0, burstTime: 2, color: PROCESS_COLORS[2] },
      { pid: 'P4', arrivalTime: 0, burstTime: 3, color: PROCESS_COLORS[3] },
    ],
  },
  {
    id: 'cpu-idle-gap',
    title: '۴. سناریوی دارای بازه بیکاری پردازنده (CPU Idle)',
    badge: 'بیکاری پردازنده',
    educationalPoint:
      'وجود فاصله زمانی بین پایان پردازش اول (t=2) و ورود پردازش بعدی (t=4) برای نمایش وضعیت بیکاری (Idle) روی نمودار گانت و تاثیر آن بر بهره‌وری پردازنده.',
    recommendedQuantum: 2,
    processes: [
      { pid: 'P1', arrivalTime: 0, burstTime: 2, color: PROCESS_COLORS[0] },
      { pid: 'P2', arrivalTime: 4, burstTime: 5, color: PROCESS_COLORS[1] },
      { pid: 'P3', arrivalTime: 5, burstTime: 3, color: PROCESS_COLORS[2] },
    ],
  },
];