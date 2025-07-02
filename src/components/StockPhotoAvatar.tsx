import { useMemo } from 'react';

interface StockPhotoAvatarProps {
  seed: string;
  size?: number;
  gender?: 'male' | 'female' | 'any';
}

const maleNames = [
  'James', 'John', 'Robert', 'Michael', 'William', 'David', 'Richard', 'Joseph',
  'Thomas', 'Daniel', 'Matthew', 'Andrew', 'Paul', 'Joshua', 'Kenneth', 'Kevin',
  'Brian', 'George', 'Steven', 'Edward', 'Ronald', 'Timothy', 'Jason', 'Jeffrey',
  'Ryan', 'Jacob', 'Gary', 'Nicholas', 'Eric', 'Jonathan', 'Stephen', 'Larry',
  'Justin', 'Scott', 'Brandon', 'Benjamin', 'Samuel', 'Frank', 'Gregory', 'Raymond',
  'Alexander', 'Patrick', 'Jack', 'Dennis', 'Jerry', 'Tyler', 'Aaron', 'Jose',
  'Nathan', 'Henry', 'Zachary', 'Douglas', 'Peter', 'Adam', 'Kyle', 'Noah',
  'Charles', 'Christopher', 'Anthony', 'Mark', 'Donald', 'Kenneth', 'Steven', 'Albert',
  'Willie', 'Elijah', 'Wayne', 'Jordan', 'Dylan', 'Arthur', 'Bryan', 'Carl',
  'Christian', 'Eugene', 'Russell', 'Louis', 'Philip', 'Johnny', 'Austin', 'Gabriel',
  'Logan', 'Albert', 'Juan', 'Vincent', 'Ralph', 'Roy', 'Eugene', 'Randy',
  'Mason', 'Russell', 'Louis', 'Philip', 'Johnny', 'Harry', 'Jesse', 'Craig',
  'Alan', 'Ralph', 'Willie', 'Albert', 'Wayne', 'Ethan', 'Jeremy', 'Keith',
  'Terry', 'Sean', 'Gerald', 'Carl', 'Harold', 'Jordan', 'Jesse', 'Bryan',
  'Lawrence', 'Arthur', 'Gabriel', 'Bruce', 'Logan', 'Juan', 'Elijah', 'Willie',
  'Albert', 'Mason', 'Vincent', 'Ralph', 'Roy', 'Eugene', 'Russell', 'Louis'
];

const femaleNames = [
  'Mary', 'Patricia', 'Jennifer', 'Linda', 'Elizabeth', 'Barbara', 'Susan', 'Jessica',
  'Sarah', 'Karen', 'Nancy', 'Lisa', 'Betty', 'Dorothy', 'Sandra', 'Ashley',
  'Kimberly', 'Emily', 'Donna', 'Michelle', 'Carol', 'Amanda', 'Melissa', 'Deborah',
  'Stephanie', 'Rebecca', 'Sharon', 'Laura', 'Cynthia', 'Kathleen', 'Amy', 'Angela',
  'Shirley', 'Anna', 'Brenda', 'Emma', 'Helen', 'Pamela', 'Nicole', 'Samantha',
  'Katherine', 'Christine', 'Debra', 'Rachel', 'Janet', 'Catherine', 'Maria', 'Heather',
  'Diane', 'Ruth', 'Julie', 'Olivia', 'Joyce', 'Virginia', 'Victoria', 'Kelly',
  'Lauren', 'Christina', 'Joan', 'Evelyn', 'Judith', 'Megan', 'Andrea', 'Cheryl',
  'Hannah', 'Martha', 'Madison', 'Teresa', 'Gloria', 'Sara', 'Janice', 'Marie',
  'Julia', 'Grace', 'Judy', 'Theresa', 'Rose', 'Beverly', 'Denise', 'Marilyn',
  'Amber', 'Danielle', 'Abigail', 'Brittany', 'Kathryn', 'Diana', 'Lori', 'Tiffany',
  'Alexis', 'Kayla', 'Frances', 'Ann', 'Alice', 'Jean', 'Doris', 'Jacqueline',
  'Natalie', 'Charlotte', 'Marie', 'Janet', 'Catherine', 'Frances', 'Christina', 'Samantha',
  'Deborah', 'Janet', 'Carolyn', 'Rachel', 'Martha', 'Maria', 'Heather', 'Diane',
  'Sophia', 'Isabella', 'Mia', 'Ava', 'Chloe', 'Zoey', 'Lily', 'Madison',
  'Ella', 'Avery', 'Sofia', 'Scarlett', 'Grace', 'Victoria', 'Aria', 'Luna'
];


// Simple hash function to get consistent random values from seed
function hashCode(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash);
}

export function getRandomName(seed: string, gender?: 'male' | 'female' | 'any'): string {
  // Determine gender from seed if not specified
  const actualGender = gender === 'any' || !gender 
    ? (hashCode(seed) % 2 === 0 ? 'female' : 'male')
    : gender;
  
  const nameList = actualGender === 'male' ? maleNames : femaleNames;
  const index = hashCode(seed) % nameList.length;
  return nameList[index];
}

export function getGenderFromSeed(seed: string): 'male' | 'female' {
  return hashCode(seed) % 2 === 0 ? 'female' : 'male';
}

export function StockPhotoAvatar({ seed, size = 80, gender = 'any' }: StockPhotoAvatarProps) {
  const actualGender = useMemo(() => {
    return gender === 'any' ? getGenderFromSeed(seed) : gender;
  }, [seed, gender]);
  
  const avatarUrl = useMemo(() => {
    // Using randomuser.me API which provides real photos of people
    // The seed ensures we get the same photo for the same input
    const genderFolder = actualGender === 'female' ? 'women' : 'men';
    const photoIndex = hashCode(seed) % 100;
    
    return `https://randomuser.me/api/portraits/${genderFolder}/${photoIndex}.jpg`;
  }, [seed, actualGender]);
  
  // Determine border color based on gender
  const borderColor = actualGender === 'female' ? '#EC4899' : '#3B82F6'; // pink-500 : blue-500
  
  return (
    <div 
      className="rounded-full"
      style={{ 
        width: size, 
        height: size,
        border: `2px solid ${borderColor}`,
        padding: '1px'
      }}
    >
      <div 
        className="overflow-hidden rounded-full bg-neutral-200 dark:bg-neutral-700"
        style={{ 
          width: '100%', 
          height: '100%'
        }}
      >
        <img
          src={avatarUrl}
          alt="Avatar"
          className="w-full h-full object-cover"
          onError={(e) => {
            // Fallback to UI Avatars if image fails to load
            const name = getRandomName(seed, actualGender);
            e.currentTarget.src = `https://ui-avatars.com/api/?name=${name}&size=${size}&background=6B7280&color=fff`;
          }}
        />
      </div>
    </div>
  );
}