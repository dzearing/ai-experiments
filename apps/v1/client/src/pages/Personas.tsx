import { useApp } from '../contexts/AppContext';
import type { PersonaType } from '../types';
import { Link } from 'react-router-dom';

const personaTypeLabels: Record<PersonaType, string> = {
  'usability-expert': 'Usability Expert',
  'developer': 'Developer',
  'tester': 'Tester',
  'data-scientist': 'Data Scientist',
  'devops': 'DevOps',
  'project-manager': 'Project Manager',
  'designer': 'Designer',
  'motion-designer': 'Motion Designer',
};

const personaTypeColors: Record<PersonaType, string> = {
  'usability-expert': 'bg-purple-100 text-purple-800',
  'developer': 'bg-blue-100 text-blue-800',
  'tester': 'bg-green-100 text-green-800',
  'data-scientist': 'bg-yellow-100 text-yellow-800',
  'devops': 'bg-orange-100 text-orange-800',
  'project-manager': 'bg-red-100 text-red-800',
  'designer': 'bg-pink-100 text-pink-800',
  'motion-designer': 'bg-indigo-100 text-indigo-800',
};

export function Personas() {
  const { personas, workItems } = useApp();
  
  return (
    <div>
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <h1 className="text-2xl font-semibold text-gray-900">Personas</h1>
          <p className="mt-2 text-sm text-gray-700">
            Manage your Claude agent personas and their assignments.
          </p>
        </div>
        <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none">
          <Link
            to="/personas/new"
            className="inline-flex items-center justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700"
          >
            Spawn new agent
          </Link>
        </div>
      </div>
      
      <div className="mt-8 flex flex-col">
        <div className="-my-2 -mx-4 overflow-x-auto sm:-mx-6 lg:-mx-8">
          <div className="inline-block min-w-full py-2 align-middle md:px-6 lg:px-8">
            <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
              <table className="min-w-full divide-y divide-gray-300">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                      Name
                    </th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                      Type
                    </th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                      Personality
                    </th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                      Status
                    </th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                      Current Task
                    </th>
                    <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-6">
                      <span className="sr-only">Actions</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {personas.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-3 py-4 text-sm text-gray-500 text-center">
                        No personas created yet. <Link to="/personas/new" className="text-indigo-600 hover:text-indigo-500">Spawn your first agent</Link>
                      </td>
                    </tr>
                  ) : (
                    personas.map((persona) => {
                      const currentTask = persona.currentTaskId 
                        ? workItems.find(w => w.id === persona.currentTaskId)
                        : null;
                      
                      return (
                        <tr key={persona.id}>
                          <td className="whitespace-nowrap px-3 py-4 text-sm font-medium text-gray-900">
                            {persona.name}
                          </td>
                          <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                            <span className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${personaTypeColors[persona.type]}`}>
                              {personaTypeLabels[persona.type]}
                            </span>
                          </td>
                          <td className="px-3 py-4 text-sm text-gray-500">
                            {persona.personality || 'Default personality'}
                          </td>
                          <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                            <span className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${
                              persona.status === 'available' 
                                ? 'bg-green-100 text-green-800'
                                : persona.status === 'busy' 
                                ? 'bg-yellow-100 text-yellow-800'
                                : 'bg-gray-100 text-gray-800'
                            }`}>
                              {persona.status}
                            </span>
                          </td>
                          <td className="px-3 py-4 text-sm text-gray-500">
                            {currentTask ? (
                              <Link to={`/work-items/${currentTask.id}`} className="text-indigo-600 hover:text-indigo-500">
                                {currentTask.title}
                              </Link>
                            ) : (
                              'None'
                            )}
                          </td>
                          <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                            <button className="text-indigo-600 hover:text-indigo-900">
                              Edit
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
      
      {/* Expertise Summary */}
      <div className="mt-8">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Team Expertise</h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Object.entries(personaTypeLabels).map(([type, label]) => {
            const count = personas.filter(p => p.type === type).length;
            return (
              <div key={type} className="bg-white overflow-hidden shadow rounded-lg">
                <div className="p-5">
                  <div className="flex items-center">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-500">{label}</p>
                      <p className="mt-1 text-3xl font-semibold text-gray-900">{count}</p>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}