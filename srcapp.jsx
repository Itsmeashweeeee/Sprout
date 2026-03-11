import { useMemo, useState } from 'react';

const initialTasks = [
  {
    id: 1,
    time: '8:00 AM',
    name: 'Blood Sugar Check',
    detail: 'Before breakfast',
    type: 'Blood Sugar',
    done: false,
    snoozed: false,
    history: [
      { date: 'Mon', status: 'done' },
      { date: 'Tue', status: 'done' },
      { date: 'Wed', status: 'done' },
      { date: 'Thu', status: 'done' },
      { date: 'Fri', status: 'pending' },
    ],
  },
  {
    id: 2,
    time: '8:30 AM',
    name: 'Metformin',
    detail: '500 mg · Take with food',
    type: 'Medication',
    done: false,
    snoozed: false,
    history: [
      { date: 'Mon', status: 'done' },
      { date: 'Tue', status: 'done' },
      { date: 'Wed', status: 'missed' },
      { date: 'Thu', status: 'done' },
      { date: 'Fri', status: 'pending' },
    ],
  },
];

const taskTypes = ['Medication', 'Blood Sugar', 'Injection', 'Vitamin', 'Routine'];
const repeatOptions = ['Every day', 'Weekdays', 'Custom'];

export default function App() {
  const [activeTab, setActiveTab] = useState('Home');
  const [tasks, setTasks] = useState(initialTasks);
  const [message, setMessage] = useState('');
  const [streak, setStreak] = useState(6);
  const [graceDays] = useState(2);
  const [cactusStage, setCactusStage] = useState(1);
  const [form, setForm] = useState({
    name: '',
    type: 'Medication',
    time: '8:00 AM',
    repeat: 'Every day',
    detail: '',
    note: '',
  });

  const completedCount = useMemo(() => tasks.filter((task) => task.done).length, [tasks]);

  const handleDone = (id) => {
    setTasks((current) =>
      current.map((task) =>
        task.id === id ? { ...task, done: true, snoozed: false } : task
      )
    );
    setStreak((value) => value + 1);
    setCactusStage((value) => Math.min(4, value + 1));
    setMessage('Nice work. Your cactus perked up.');
  };

  const handleSnooze = (id) => {
    setTasks((current) =>
      current.map((task) =>
        task.id === id ? { ...task, snoozed: true } : task
      )
    );
    setMessage('Reminder snoozed.');
  };

  const handleAddTask = (event) => {
    event.preventDefault();
    if (!form.name.trim()) return;

    const detailParts = [form.detail, form.note].filter(Boolean);

    const newTask = {
      id: Date.now(),
      time: form.time,
      name: form.name,
      detail: detailParts.join(' · ') || 'New check-in',
      type: form.type,
      done: false,
      snoozed: false,
      history: [
        { date: 'Mon', status: 'pending' },
        { date: 'Tue', status: 'pending' },
        { date: 'Wed', status: 'pending' },
        { date: 'Thu', status: 'pending' },
        { date: 'Fri', status: 'pending' },
      ],
    };

    setTasks((current) => [...current, newTask]);
    setForm({
      name: '',
      type: 'Medication',
      time: '8:00 AM',
      repeat: 'Every day',
      detail: '',
      note: '',
    });
    setActiveTab('Home');
    setMessage('Your cactus has a new check-in.');
  };

  const renderCactus = () => {
    return (
      <div className="cactus-wrap">
        <div className="cactus-inner">
          {cactusStage >= 2 && <div className="cactus-arm cactus-arm-left" />}
          {cactusStage >= 3 && <div className="cactus-arm cactus-arm-right" />}
          <div className={`cactus-body ${completedCount ? 'cactus-body-happy' : ''}`}>
            <div className="spike spike-1" />
            <div className="spike spike-2" />
            <div className="spike spike-3" />
            <div className="spike spike-4" />
            <div className="eye eye-left" />
            <div className="eye eye-right" />
            <div className="mouth" />
            <div className="flower">🌸</div>
          </div>
        </div>
      </div>
    );
  };

  const ScreenWrapper = ({ children }) => (
    <div className="phone-shell">
      {children}
      <div className="bottom-nav">
        {['Home', 'Tasks', 'History', 'Desert'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`nav-button ${tab === activeTab ? 'nav-button-active' : ''}`}
          >
            {tab}
          </button>
        ))}
      </div>
    </div>
  );

  const HomeScreen = () => (
    <ScreenWrapper>
      <div className="section header-section">
        <div className="header-row">
          <div>
            <p className="title-lg">Good morning</p>
            <p className="muted-text">Your cactus is ready for today’s check-in.</p>
          </div>
          <button className="icon-button">⚙️</button>
        </div>
      </div>

      <div className="section scene-section">
        <div className="scene-card">
          <div className="sun" />
          <div className="hill hill-back" />
          <div className="hill hill-front" />
          {renderCactus()}
          <div className="scene-item rock">🪨</div>
          <div className="scene-item flower-right">🌼</div>
          {cactusStage >= 4 && <div className="scene-item lizard">🦎</div>}
        </div>
      </div>

      {!!message && (
        <div className="section message-section">
          <div className="message-box">{message}</div>
        </div>
      )}

      <div className="section">
        <h2 className="title-md">Today’s Check-Ins</h2>
      </div>

      <div className="section card-list">
        {tasks.map((task) => (
          <div key={task.id} className="task-card">
            <div className="task-top-row">
              <p className="task-time">{task.time}</p>
              <span className="task-chip">{task.type}</span>
            </div>
            <p className="task-name">{task.name}</p>
            <p className="task-detail">{task.detail}</p>
            {task.snoozed && !task.done && (
              <p className="task-snoozed">Snoozed for now</p>
            )}
            <div className="task-button-row">
              <button
                onClick={() => handleDone(task.id)}
                className={`primary-button ${task.done ? 'primary-button-done' : ''}`}
              >
                {task.done ? 'Done ✓' : 'Done'}
              </button>
              <button
                onClick={() => handleSnooze(task.id)}
                className="secondary-button"
              >
                Snooze
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="section bottom-card-section">
        <div className="summary-card">
          <p className="summary-label">Current Streak</p>
          <p className="summary-value">{streak} days</p>
          <p className="summary-subtext">Grace Days Left: {graceDays}</p>
        </div>
      </div>
    </ScreenWrapper>
  );

  const TasksScreen = () => (
    <ScreenWrapper>
      <div className="section">
        <h1 className="title-lg">Add Task</h1>
        <p className="muted-text">Keep this quick. Your cactus hates long forms.</p>
      </div>

      <form onSubmit={handleAddTask} className="section form-wrap">
        <label className="form-field">
          <span className="field-label">What do you want to track?</span>
          <input
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="Blood Sugar Check"
            className="text-input"
          />
        </label>

        <label className="form-field">
          <span className="field-label">Task type</span>
          <select
            value={form.type}
            onChange={(e) => setForm({ ...form, type: e.target.value })}
            className="text-input"
          >
            {taskTypes.map((type) => (
              <option key={type}>{type}</option>
            ))}
          </select>
        </label>

        <label className="form-field">
          <span className="field-label">When should I remind you?</span>
          <input
            value={form.time}
            onChange={(e) => setForm({ ...form, time: e.target.value })}
            placeholder="8:00 AM"
            className="text-input"
          />
        </label>

        <label className="form-field">
          <span className="field-label">How often?</span>
          <select
            value={form.repeat}
            onChange={(e) => setForm({ ...form, repeat: e.target.value })}
            className="text-input"
          >
            {repeatOptions.map((option) => (
              <option key={option}>{option}</option>
            ))}
          </select>
        </label>

        <label className="form-field">
          <span className="field-label">
            {form.type === 'Medication'
              ? 'Dose'
              : form.type === 'Blood Sugar'
                ? 'Target range'
                : form.type === 'Injection'
                  ? 'Details'
                  : 'Optional detail'}
          </span>
          <input
            value={form.detail}
            onChange={(e) => setForm({ ...form, detail: e.target.value })}
            placeholder={
              form.type === 'Medication'
                ? '500 mg'
                : form.type === 'Blood Sugar'
                  ? '80–130 mg/dL'
                  : form.type === 'Injection'
                    ? '10 units'
                    : 'Optional'
            }
            className="text-input"
          />
        </label>

        <label className="form-field">
          <span className="field-label">Optional note</span>
          <textarea
            value={form.note}
            onChange={(e) => setForm({ ...form, note: e.target.value })}
            placeholder="Before breakfast"
            className="text-input text-area"
          />
        </label>

        <button className="primary-button full-width-button">Save Task</button>
      </form>
    </ScreenWrapper>
  );

  const HistoryScreen = () => (
    <ScreenWrapper>
      <div className="section">
        <h1 className="title-lg">History</h1>
        <p className="muted-text">A simple look at how things are going.</p>
      </div>

      <div className="section card-list">
        <div className="summary-card">
          <p className="summary-label">Adherence Rate</p>
          <p className="summary-value">92%</p>
          <p className="summary-subtext">Longest Streak: 21 days</p>
        </div>

        {tasks.map((task) => (
          <div key={task.id} className="task-card">
            <p className="task-name">{task.name}</p>
            <div className="history-grid">
              {task.history.map((entry) => (
                <div key={entry.date} className="history-item">
                  <div
                    className={`history-status ${
                      entry.status === 'done'
                        ? 'history-done'
                        : entry.status === 'missed'
                          ? 'history-missed'
                          : 'history-pending'
                    }`}
                  >
                    {entry.status === 'done' ? '✓' : entry.status === 'missed' ? '–' : '•'}
                  </div>
                  <p className="history-date">{entry.date}</p>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </ScreenWrapper>
  );

  const DesertScreen = () => (
    <ScreenWrapper>
      <div className="section">
        <h1 className="title-lg">Your Desert</h1>
        <p className="muted-text">Your little ecosystem grows with consistency.</p>
      </div>

      <div className="section card-list">
        <div className="scene-card desert-large">
          <div className="sun large-sun" />
          <div className="hill hill-back hill-large-back" />
          <div className="hill hill-front hill-large-front" />
          {renderCactus()}
          <div className="scene-item rock large-rock">🪨</div>
          <div className="scene-item flower-right large-flower">🌼</div>
          {cactusStage >= 2 && <div className="scene-item bloom-left">🌸</div>}
          {cactusStage >= 3 && <div className="scene-item mountain">⛰️</div>}
          {cactusStage >= 4 && <div className="scene-item lizard large-lizard">🦎</div>}
        </div>

        <div className="task-card">
          <p className="summary-label">Cactus Stage</p>
          <p className="summary-value">{cactusStage} / 4</p>
          <div className="milestone-list">
            <p>3 days: flower appears</p>
            <p>7 days: first arm grows</p>
            <p>14 days: second arm grows</p>
            <p>30 days: desert scene expands</p>
          </div>
        </div>
      </div>
    </ScreenWrapper>
  );

  return (
    <div className="app-page">
      {activeTab === 'Home' && <HomeScreen />}
      {activeTab === 'Tasks' && <TasksScreen />}
      {activeTab === 'History' && <HistoryScreen />}
      {activeTab === 'Desert' && <DesertScreen />}
    </div>
  );
}
