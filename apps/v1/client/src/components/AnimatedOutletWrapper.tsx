import { useLocation, useOutlet } from 'react-router-dom';
import { AnimatedTransition } from './AnimatedTransition';
import { useNavigationDirection } from '../hooks/useNavigationDirection';

interface AnimatedOutletWrapperProps {
  className?: string;
  delay?: number;
  distance?: number;
}

export function AnimatedOutletWrapper({ 
  className = '', 
  delay = 200,
  distance = 20 
}: AnimatedOutletWrapperProps) {
  const location = useLocation();
  const outlet = useOutlet();
  const direction = useNavigationDirection();
  
  return (
    <AnimatedTransition
      transitionKey={location.pathname}
      className={className}
      delay={delay}
      distance={distance}
      reverse={direction === 'backward'}
      centered={false}
    >
      {outlet}
    </AnimatedTransition>
  );
}