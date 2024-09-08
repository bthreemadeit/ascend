"use client";

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Trash2 } from 'lucide-react';

type WeekDay = "Понедельник" | "Вторник" | "Среда" | "Четверг" | "Пятница" | "Суббота" | "Воскресенье";

const weekdays: WeekDay[] = ["Понедельник", "Вторник", "Среда", "Четверг", "Пятница", "Суббота", "Воскресенье"];

interface Exercise {
  name: string;
  oneRepMax: string;
  intensity?: number;
  weight?: number;
  sets?: string;
  reps?: string;
  cycle?: string;
  difficulty?: string;
}

type WeekProgram = Record<WeekDay, Exercise[]>;

const periodizationTypes = [
  { value: 'linear', label: 'Линейная периодизация' },
  { value: 'wave', label: 'Волновая периодизация' },
  { value: 'block', label: 'Блочная периодизация' },
];

const durationOptions = [
  { value: '4', label: '4 недели' },
  { value: '8', label: '8 недель' },
  { value: '12', label: '12 недель' },
  { value: '16', label: '16 недель' }
];

function TrainingProgramCalculator() {
  const [periodizationType, setPeriodizationType] = useState<string>('');
  const [duration, setDuration] = useState<string>('');
  const [selectedDays, setSelectedDays] = useState<WeekDay[]>([]);
  const [exercises, setExercises] = useState<Record<WeekDay, Exercise[]>>(() => {
    const initialExercises: Record<WeekDay, Exercise[]> = {} as Record<WeekDay, Exercise[]>;
    weekdays.forEach(day => {
      initialExercises[day] = [];
    });
    return initialExercises;
  });
  const [generatedProgram, setGeneratedProgram] = useState<WeekProgram[] | null>(null);

  const handleDayToggle = (day: WeekDay) => {
    setSelectedDays(prev => 
      prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]
    );
    if (exercises[day].length === 0) {
      setExercises(prev => ({
        ...prev,
        [day]: [{ name: selectedDays.length === 0 ? 'Жим лёжа' : '', oneRepMax: '' }]
      }));
    }
  };

  const handleAddExercise = (day: WeekDay) => {
    setExercises(prev => ({
      ...prev,
      [day]: [...(prev[day] || []), { name: '', oneRepMax: '' }]
    }));
  };

  const handleRemoveExercise = (day: WeekDay, index: number) => {
    setExercises(prev => ({
      ...prev,
      [day]: prev[day].filter((_, i) => i !== index)
    }));
  };

  const handleExerciseChange = (day: WeekDay, index: number, field: 'name' | 'oneRepMax', value: string) => {
    setExercises(prev => ({
      ...prev,
      [day]: prev[day].map((exercise, i) => 
        i === index ? { ...exercise, [field]: value } : exercise
      )
    }));
  };

  const calculateLinearPeriodization = (weeks: number, exercises: Record<WeekDay, Exercise[]>): WeekProgram[] => {
    const program: WeekProgram[] = [];
    const cycles = [
      { name: "Лёгкий", minIntensity: 60, maxIntensity: 70, sets: "3-4", reps: "12-15" },
      { name: "Средний", minIntensity: 70, maxIntensity: 80, sets: "3-4", reps: "8-12" },
      { name: "Тяжёлый", minIntensity: 80, maxIntensity: 90, sets: "4-5", reps: "5-8" },
      { name: "Deload", minIntensity: 50, maxIntensity: 60, sets: "2-3", reps: "10-15" }
    ];

    for (let week = 0; week < weeks; week++) {
      const cycleIndex = week % cycles.length;
      const cycle = cycles[cycleIndex];
      const baseIntensity = (cycle.minIntensity + cycle.maxIntensity) / 2;
      const progressionFactor = 1 + (week / weeks) * 0.1;

      const weekProgram: WeekProgram = {} as WeekProgram;
      Object.entries(exercises).forEach(([day, dayExercises]) => {
        weekProgram[day as WeekDay] = dayExercises.map(exercise => {
          const intensity = Math.min(baseIntensity * progressionFactor, 95);
          return {
            ...exercise,
            intensity: Math.round(intensity),
            weight: Math.round(Number(exercise.oneRepMax) * intensity / 100),
            sets: cycle.sets,
            reps: cycle.reps,
            cycle: cycle.name
          };
        });
      });
      program.push(weekProgram);
    }

    return program;
  };

  const calculateWavePeriodization = (weeks: number, exercises: Record<WeekDay, Exercise[]>, selectedDays: WeekDay[]): WeekProgram[] => {
    const program: WeekProgram[] = [];
    const cycles = [
      { name: "Лёгкий", minIntensity: 60, maxIntensity: 70, sets: "3-4", reps: "12-15" },
      { name: "Средний", minIntensity: 70, maxIntensity: 80, sets: "3-4", reps: "8-12" },
      { name: "Тяжёлый", minIntensity: 80, maxIntensity: 90, sets: "4-5", reps: "5-8" },
      { name: "Средний", minIntensity: 70, maxIntensity: 80, sets: "3-4", reps: "8-12" }
    ];

    for (let week = 0; week < weeks; week++) {
      const weekProgram: WeekProgram = {} as WeekProgram;
      const progressionFactor = 1 + (week / weeks) * 0.1;

      selectedDays.forEach((day, dayIndex) => {
        const dayExercises = exercises[day] || [];
        weekProgram[day] = dayExercises.map((exercise, exerciseIndex) => {
          const startingPoint = exerciseIndex % cycles.length;
          const cycleIndex = (startingPoint + dayIndex + week) % cycles.length;
          const cycle = cycles[cycleIndex];
          
          const baseIntensity = (cycle.minIntensity + cycle.maxIntensity) / 2;
          const intensity = Math.min(baseIntensity * progressionFactor, 95);
          return {
            ...exercise,
            intensity: Math.round(intensity),
            weight: Math.round(Number(exercise.oneRepMax) * intensity / 100),
            sets: cycle.sets,
            reps: cycle.reps,
            difficulty: cycle.name
          };
        });
      });
      program.push(weekProgram);
    }

    return program;
  };

  const calculateBlockPeriodization = (weeks: number, exercises: Record<WeekDay, Exercise[]>): WeekProgram[] => {
    const program: WeekProgram[] = [];
    const blocks = [
      { name: "Гипертрофия", minIntensity: 65, maxIntensity: 75, sets: "4-5", reps: "8-12" },
      { name: "Сила", minIntensity: 75, maxIntensity: 85, sets: "4-5", reps: "4-6" },
      { name: "Мощность", minIntensity: 85, maxIntensity: 95, sets: "3-4", reps: "3-5" },
      { name: "Выносливость", minIntensity: 40, maxIntensity: 60, sets: "3-4", reps: "15-20" }
    ];

    const blockDuration = Math.max(1, Math.floor(weeks / 4));

    let currentWeek = 0;
    while (currentWeek < weeks) {
      for (const block of blocks) {
        for (let i = 0; i < blockDuration && currentWeek < weeks; i++, currentWeek++) {
          const progressWithinBlock = blockDuration > 1 ? i / (blockDuration - 1) : 0;
          const baseIntensity = block.minIntensity + (block.maxIntensity - block.minIntensity) * progressWithinBlock;
          const progressionFactor = 1 + (currentWeek / weeks) * 0.1;
          const intensity = Math.min(baseIntensity * progressionFactor, 95);

          const weekProgram: WeekProgram = {} as WeekProgram;
          Object.entries(exercises).forEach(([day, dayExercises]) => {
            weekProgram[day as WeekDay] = dayExercises.map(exercise => ({
              ...exercise,
              intensity: Math.round(intensity),
              weight: Math.round(Number(exercise.oneRepMax) * intensity / 100),
              sets: block.sets,
              reps: block.reps,
              cycle: block.name
            }));
          });
          program.push(weekProgram);
        }
      }
    }

    return program;
  };

  const generateProgram = () => {
    const weeks = parseInt(duration);

    let program;
    switch (periodizationType) {
      case 'linear':
        program = calculateLinearPeriodization(weeks, exercises);
        break;
      case 'wave':
        program = calculateWavePeriodization(weeks, exercises, selectedDays);
        break;
      case 'block':
        program = calculateBlockPeriodization(weeks, exercises);
        break;
      default:
        throw new Error("Неизвестный тип периодизации");
    }

    setGeneratedProgram(program);
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'Лёгкий': return 'bg-green-100';
      case 'Средний': return 'bg-yellow-100';
      case 'Тяжёлый': return 'bg-red-100';
      default: return '';
    }
  };

  return (
    <div className="flex flex-col min-h-screen w-full max-w-4xl mx-auto p-6">
      <div className="flex-grow">
        <div className="mb-6">
          <h1 className="text-3xl font-bold">Ascend</h1>
          <p className="text-xl text-muted-foreground mt-1">Генератор программы тренировок</p>
        </div>
        <div className="space-y-4">
          <Select onValueChange={setPeriodizationType}>
            <SelectTrigger>
              <SelectValue placeholder="Выберите тип периодизации" />
            </SelectTrigger>
            <SelectContent>
              {periodizationTypes.map(type => (
                <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select onValueChange={setDuration}>
            <SelectTrigger>
              <SelectValue placeholder="Выберите длительность программы" />
            </SelectTrigger>
            <SelectContent>
              {durationOptions.map(option => (
                <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <div className="flex flex-wrap gap-4">
            {weekdays.map(day => (
              <div key={day} className="flex items-center space-x-2">
                <Checkbox
                  id={day}
                  checked={selectedDays.includes(day)}
                  onCheckedChange={() => handleDayToggle(day)}
                />
                <label htmlFor={day}>{day}</label>
              </div>
            ))}
          </div>

          {selectedDays.map(day => (
            <div key={day} className="space-y-2">
              <h3>{day}</h3>
              {exercises[day]?.map((exercise, index) => (
                <div key={index} className="flex items-center space-x-2">
                  <Input
                    value={exercise.name}
                    onChange={(e) => handleExerciseChange(day, index, 'name', e.target.value)}
                    placeholder="Название упражнения"
                  />
                  <Input
                    value={exercise.oneRepMax}
                    onChange={(e) => handleExerciseChange(day, index, 'oneRepMax', e.target.value)}
                    placeholder="1ПМ (кг)"
                    type="number"
                  />
                  <Button 
                    variant="outline" 
                    size="icon"
                    onClick={() => handleRemoveExercise(day, index)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              <Button variant="outline" onClick={() => handleAddExercise(day)}>+ Ещё одно</Button>
            </div>
          ))}

          <Button onClick={generateProgram}>Сгенерировать программу</Button>

          {generatedProgram && (
            <div className="mt-4">
              <h3 className="text-lg font-semibold">Сгенерированная программа:</h3>
              {generatedProgram.map((week, weekIndex) => (
                <div key={weekIndex} className="mt-4">
                  <h4 className="font-semibold">Неделя {weekIndex + 1}:</h4>
                  {Object.entries(week)
                    .filter(([day]) => selectedDays.includes(day as WeekDay))
                    .map(([day, exercises]) => (
                    <div key={day} className="mt-2">
                      <h5 className="font-medium">{day}:</h5>
                      <div className="overflow-x-auto">
                        <table className="w-full border-collapse">
                          <thead>
                            <tr className="bg-gray-100">
                              <th className="border p-2">Упражнение</th>
                              <th className="border p-2">Интенсивность</th>
                              <th className="border p-2">Вес (кг)</th>
                              <th className="border p-2">Подходы</th>
                              <th className="border p-2">Повторения</th>
                              {periodizationType === 'wave' && <th className="border p-2">Сложность</th>}
                              {periodizationType === 'block' && <th className="border p-2">Цикл</th>}
                            </tr>
                          </thead>
                          <tbody>
                            {exercises.map((exercise, exerciseIndex) => (
                              <tr key={exerciseIndex}>
                                <td className="border p-2">{exercise.name}</td>
                                <td className="border p-2">{exercise.intensity}%</td>
                                <td className="border p-2">{exercise.weight}</td>
                                <td className="border p-2">{exercise.sets}</td>
                                <td className="border p-2">{exercise.reps}</td>
                                {periodizationType === 'wave' && (
                                  <td className={`border p-2 ${getDifficultyColor(exercise.difficulty || '')}`}>
                                    {exercise.difficulty}
                                  </td>
                                )}
                                {periodizationType === 'block' && <td className="border p-2">{exercise.cycle}</td>}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      
      <div className="mt-12 flex justify-between text-xs text-muted-foreground">
        <span>Ascend 0.1</span>
        <span>B3</span>
      </div>
    </div>
  );
}

export default TrainingProgramCalculator;
