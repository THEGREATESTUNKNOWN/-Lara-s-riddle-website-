import { db } from './firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';

export interface DailyPuzzle {
  date: string;
  topic: string;
  holidayName: string;
  imageUrl: string;
}

const HOLIDAYS = [
  { month: 0, day: 1, name: "New Year's Day", query: "fireworks celebration" },
  { month: 1, day: 14, name: "Valentine's Day", query: "romantic flowers heart" },
  { month: 2, day: 17, name: "St. Patrick's Day", query: "ireland green clover" },
  { month: 3, day: 22, name: "Earth Day", query: "nature forest globe" },
  { month: 4, day: 5, name: "Cinco de Mayo", query: "mexico fiesta celebration" },
  { month: 5, day: 19, name: "Juneteenth", query: "freedom celebration history" },
  { month: 6, day: 4, name: "Independence Day", query: "fourth of july america" },
  { month: 9, day: 31, name: "Halloween", query: "spooky pumpkin fall" },
  { month: 11, day: 25, name: "Christmas", query: "winter christmas snow" },
  { month: 11, day: 31, name: "New Year's Eve", query: "party countdown midnight" },
];

function getClosestHoliday(date: Date) {
  const currentYear = date.getFullYear();
  
  // Create full dates for this year
  const holidayDates = HOLIDAYS.map(h => ({
    ...h,
    date: new Date(currentYear, h.month, h.day)
  }));

  // Find the one closest to 'date' (could be in the past or future)
  let closest = holidayDates[0];
  let minDiff = Math.abs(date.getTime() - holidayDates[0].date.getTime());

  holidayDates.forEach(h => {
    const diff = Math.abs(date.getTime() - h.date.getTime());
    if (diff < minDiff) {
      minDiff = diff;
      closest = h;
    }
  });

  return closest;
}

export async function getOrGenerateDailyPuzzle(): Promise<DailyPuzzle> {
  const now = new Date();
  const hour = now.getHours();
  const minute = now.getMinutes();
  
  // Transition at 11:59 PM (23:59)
  let targetDate = new Date(now);
  if (hour === 23 && minute >= 59) {
    targetDate.setDate(targetDate.getDate() + 1);
  }
  
  const dateKey = targetDate.toISOString().split('T')[0];
  const docRef = doc(db, 'daily_puzzles', dateKey);
  const docSnap = await getDoc(docRef);
  
  if (docSnap.exists()) {
    return docSnap.data() as DailyPuzzle;
  }
  
  const holiday = getClosestHoliday(targetDate);
  
  // Use professional Unsplash images for the topic
  const imageUrl = `https://source.unsplash.com/featured/1200x800?${encodeURIComponent(holiday.query)}`;
  
  const puzzle: DailyPuzzle = {
    date: dateKey,
    topic: holiday.name,
    holidayName: holiday.name,
    imageUrl: imageUrl
  };
  
  await setDoc(docRef, puzzle);
  return puzzle;
}
