# Foliage Painter System

Универсальная система для создания растительности с использованием тонких инстансов Babylon.js.

## 🎯 Основные возможности

- **Тонкие инстансы** - эффективное создание множества объектов
- **Интерактивное размещение** - клик мышью для размещения
- **Предварительный просмотр** - визуальный индикатор области
- **Настраиваемые параметры** - полный контроль над генерацией
- **Поддержка материалов** - drag & drop кастомных материалов
- **Интеграция с редактором** - полная совместимость

## 📁 Структура файлов

```
grass/
├── configuration.ts      # Конфигурация параметров
├── geometry.ts          # Генерация геометрии и матриц
├── material.ts          # Управление материалами
├── preview.ts           # Система предварительного просмотра
├── foliage-painter.ts   # Основной класс FoliagePainter
├── foliage.tsx          # React компонент интерфейса
└── index.ts            # Экспорты модуля
```

## ⚙️ Конфигурация

### Основные параметры

```typescript
export const foliageConfiguration = {
    brushRadius: 100,           // Радиус области размещения
    density: 1,                 // Количество инстансов за клик
    distance: 1,                // Минимальное расстояние между инстансами
    holdToPaint: true,          // Непрерывное рисование при удержании
    randomScalingMin: 0.8,      // Минимальный масштаб
    randomScalingMax: 1.2,      // Максимальный масштаб
    scalingFactor: 1.0,         // Базовый масштаб
    randomRotationMin: [0, -π, 0], // Минимальная случайная ротация
    randomRotationMax: [0, π, 0],  // Максимальная случайная ротация
    toolType: "add",            // Тип инструмента: "add" | "scale"
    rescaleValue: 0.01,         // Значение масштабирования для scale tool
    materialPath: "",           // Путь к материалу
};
```

## 🎨 Использование

### 1. Создание FoliagePainter

```typescript
import { FoliagePainter } from "./foliage-painter";

const painter = new FoliagePainter(editor);
```

### 2. Настройка мешей

```typescript
// Выбор мешей для создания инстансов
const selectedMeshes = [mesh1, mesh2, mesh3];
painter.setMeshes(selectedMeshes);
```

### 3. Обработка событий мыши

```typescript
// В обработчике событий мыши
painter.onPointerEvent(pointerInfo);
```

### 4. React компонент

```typescript
import { EditorFoliageInspector } from "./foliage";

<EditorFoliageInspector editor={editor} />
```

## 🔧 API

### FoliagePainter

#### Свойства
- `density: number` - количество инстансов за клик
- `distance: number` - минимальное расстояние между инстансами
- `holdToPaint: boolean` - непрерывное рисование
- `randomScalingMin/Max: number` - диапазон случайного масштабирования
- `scalingFactor: Vector3` - базовый масштаб
- `randomRotationMin/Max: Vector3` - диапазон случайной ротации
- `toolType: "add" | "scale"` - тип инструмента
- `rescaleValue: Vector3` - значение масштабирования для scale tool

#### Методы
- `setMeshes(meshes: Mesh[])` - установка мешей для инстансирования
- `onPointerEvent(info: PointerInfo)` - обработка событий мыши
- `onControlKeyReleased()` - обработка отпускания Control
- `dispose()` - очистка ресурсов

### FoliagePreviewManager

#### Методы
- `createPreviewIndicator(position: Vector3, normal: Vector3)` - создание индикатора
- `updateIndicatorTransform(position: Vector3, normal: Vector3)` - обновление позиции
- `scheduleUpdate()` - запланированное обновление
- `dispose()` - очистка ресурсов

## 🎮 Интерактивность

### Добавление инстансов
1. Выберите меши для инстансирования
2. Настройте параметры в интерфейсе
3. Кликните на поверхность для размещения
4. Инстансы создаются автоматически

### Удаление инстансов
- Правый клик для удаления инстансов в радиусе

### Масштабирование
- Переключитесь в режим "scale"
- Кликните для увеличения/уменьшения существующих инстансов

## 🔄 Undo/Redo

Система автоматически регистрирует операции для отмены/повтора:
- Добавление инстансов
- Удаление инстансов
- Масштабирование инстансов

## 📊 Производительность

- Использует тонкие инстансы Babylon.js для эффективности
- Оптимизированные обновления с debouncing
- Минимальное количество draw calls
- Автоматическое обновление bounding box

## 🎨 Материалы

- Поддержка drag & drop материалов
- Автоматическое создание дефолтного материала
- Совместимость с PBR материалами
- Настройка backFaceCulling для растительности 
