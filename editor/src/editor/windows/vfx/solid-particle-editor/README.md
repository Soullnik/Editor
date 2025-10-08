# Solid Particle Editor

Визуальный редактор для создания анимаций Solid Particle System с использованием граф-нод интерфейса.

## Архитектура

### Структура папок
```
solid-particle-editor/
├── components/           # React компоненты
│   ├── NodeList.tsx     # Левая панель со списком нод
│   ├── GraphView.tsx    # Центральная панель с графом
│   └── PreviewPanel.tsx # Правая панель с превью
├── templates/            # Шаблоны нод
│   ├── index.ts
│   ├── ParticleNodeTemplate.ts
│   ├── AnimationNodeTemplate.ts
│   ├── MathNodeTemplate.ts
│   ├── TimeNodeTemplate.ts
│   ├── ConstantNodeTemplate.ts
│   ├── NoiseNodeTemplate.ts
│   └── CurveNodeTemplate.ts
├── types.ts             # TypeScript интерфейсы
├── SolidParticleEditor.tsx # Главный компонент
├── custom-sps.ts        # CustomSolidParticleSystem
└── index.ts            # Экспорты
```

### Компоненты

#### NodeList
- **Назначение**: Левая панель со списком доступных нод
- **Функции**: 
  - Отображение нод по категориям
  - Drag & Drop для добавления нод в граф
  - Поиск и фильтрация нод

#### GraphView
- **Назначение**: Центральная панель с визуальным графом
- **Функции**:
  - HTML/SVG рендеринг вместо Canvas
  - Drag & Drop нод
  - Zoom и Pan
  - Создание соединений между нодами
  - Выбор и редактирование нод

#### PreviewPanel
- **Назначение**: Правая панель с превью SPS
- **Функции**:
  - Отображение SPS меша
  - Play/Stop анимации
  - Реальное время обновления частиц

### Типы нод

#### Particle Nodes
- **Particle Input**: Входные данные частицы (позиция, ротация, масштаб, цвет)

#### Animation Nodes
- **Position Animation**: Анимация позиции
- **Rotation Animation**: Анимация ротации
- **Scaling Animation**: Анимация масштаба
- **Color Animation**: Анимация цвета

#### Math Nodes
- **Add**: Сложение
- **Multiply**: Умножение
- **Sin/Cos**: Тригонометрические функции

#### Time Nodes
- **Time**: Абсолютное время
- **Delta Time**: Время между кадрами

#### Constant Nodes
- **Number**: Числовая константа
- **Vector3**: Векторная константа
- **Color3**: Цветовая константа

#### Noise Nodes
- **Perlin Noise**: Шум Перлина
- **Simplex Noise**: Симплекс шум

#### Curve Nodes
- **Linear Curve**: Линейная интерполяция
- **Ease In-Out**: Плавная кривая
- **Bounce Curve**: Отскакивающая кривая

## Использование

```tsx
import { SolidParticleEditor } from "./solid-particle-editor";

<SolidParticleEditor selectedComponent={selectedComponent} />
```

## Особенности

- **HTML/SVG рендеринг**: Более производительный чем Canvas
- **Модульная архитектура**: Каждый тип ноды в отдельном файле
- **shadcn/ui**: Современный UI на базе Tailwind CSS
- **TypeScript**: Полная типизация
- **Реальное время**: Превью с live обновлением частиц
