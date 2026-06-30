import { useProjectsStore } from '../store/projects.store';
import { useOracleStore } from '../store/oracle.store';
import { electronBridge } from './electron-bridge';
import { Milestone } from './project-registry';

const MAC_OS_PATH_SEPARATOR = '/'; // Based on given paths

function parseRoadmapMarkdown(content: string): Milestone[] {
  const lines = content.split('\n');
  const milestones: Milestone[] = [];
  
  // Basic markdown checklist parser
  // Matches: - [x] Title or - [ ] Title
  const checklistRegex = /^\s*-\s*\[([ xX])\]\s*(.*)$/;

  let index = 1;
  for (const line of lines) {
    const match = line.match(checklistRegex);
    if (match) {
      const isCompleted = match[1].toLowerCase() === 'x';
      const title = match[2].trim();
      milestones.push({
        id: `m-${index++}`, // In a real app we might want stable IDs, but this works for sync if we compare by title
        title,
        completed: isCompleted,
      });
    }
  }

  return milestones;
}

export async function syncMilestones() {
  if (!electronBridge.isAvailable) return;

  const projects = useProjectsStore.getState().projects;
  const setMilestones = useProjectsStore.getState().setMilestones;
  const addNotification = useOracleStore.getState().addNotification;

  for (const project of projects) {
    if (!project.rootPath) continue;

    const roadmapPath = `${project.rootPath}${MAC_OS_PATH_SEPARATOR}ROADMAP.md`;
    try {
      const content = await electronBridge.readFile(roadmapPath);
      if (!content) continue;

      const parsedMilestones = parseRoadmapMarkdown(content);
      const currentMilestones = project.milestones;

      // Detect changes
      let changed = false;

      // Check for removed or added milestones (simplistic check: different lengths or different titles)
      // To be more precise, we match by title
      
      const currentMap = new Map(currentMilestones.map(m => [m.title, m]));
      const parsedMap = new Map(parsedMilestones.map(m => [m.title, m]));

      // 1. Added milestones
      for (const [title, parsed] of parsedMap.entries()) {
        if (!currentMap.has(title)) {
          changed = true;
          addNotification({
            title: `New Milestone Added`,
            body: `"${title}" was added to ${project.name} roadmap.`,
            project: project.name,
            category: 'feature_added',
            priority: 'low',
            type: 'info'
          });
        }
      }

      // 2. Removed milestones
      for (const [title, current] of currentMap.entries()) {
        if (!parsedMap.has(title)) {
          changed = true;
          addNotification({
            title: `Milestone Removed`,
            body: `"${title}" was removed from ${project.name} roadmap.`,
            project: project.name,
            category: 'milestone_changed',
            priority: 'medium',
            type: 'warning'
          });
        }
      }

      // 3. Status changes
      for (const [title, parsed] of parsedMap.entries()) {
        const current = currentMap.get(title);
        if (current && current.completed !== parsed.completed) {
          changed = true;
          if (parsed.completed) {
            addNotification({
              title: `Milestone Completed`,
              body: `"${title}" is now marked as complete for ${project.name}.`,
              project: project.name,
              category: 'milestone_completed',
              priority: 'medium',
              type: 'success'
            });
          } else {
            addNotification({
              title: `Milestone Uncompleted`,
              body: `"${title}" was unchecked in ${project.name} roadmap.`,
              project: project.name,
              category: 'milestone_changed',
              priority: 'low',
              type: 'info'
            });
          }
        }
      }

      if (changed) {
        // In our store, we preserve IDs if they existed, else create new ones
        const updatedMilestones: Milestone[] = parsedMilestones.map(pm => {
          const existing = currentMap.get(pm.title);
          return existing ? { ...existing, completed: pm.completed } : pm;
        });

        setMilestones(project.id, updatedMilestones);
      }

    } catch (e) {
      console.error(`Failed to sync ROADMAP.md for project ${project.name}:`, e);
    }
  }
}
