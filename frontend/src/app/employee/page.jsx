'use client';
import React from 'react';
import Image from 'next/image';
import logo from '../../../public/images/logo1.svg';
import '../globals.css'

const classes = {
  Main: 'w-full h-screen flex flex-col justify-center items-center bg-[#0F1B0E]',
  EmployeeContainer: 'w-full h-full flex flex-col justify-center items-center p-4 gap-6',
  LogoContainer: 'w-full h-16 flex mb-4 justify-center items-center',
  Logo: 'object-contain h-24 w-full -mb-8',
  EmployeeCardsContainer: 'w-full max-w-[1000px] flex flex-wrap justify-center items-center -mt-6 gap-6',
  EmployeeCards: 'relative w-[250px] h-[240px] p-[2px] bg-gradient-to-r from-[#119F86] to-[#063930] rounded-3xl',
  CardInner: 'w-full h-full bg-[#0F1B0E] rounded-3xl flex flex-col justify-center items-center p-4 gap-6',
  CardTitle: 'text-[#AACBB8] text-[20px] mt-4 qurova leading-none',
  CardComponent: 'w-full h-full flex flex-col justify-center items-center p-2',
  TaskItem: 'text-[#AACBB8] text-sm  flex justify-between w-full',
  TimeDisplay: 'text-[#AACBB8] text-2xl font-mono',
  ChatBubble: 'w-3 h-3 rounded-full bg-green-500',
  ScheduleItem: 'text-[#AACBB8] text-xs w-full text-center',
  StatusIndicator: 'w-4 h-4 rounded-full',
  UrgentTask: 'text-red-400 text-xs w-full text-center',
  submitSection: 'w-full h-16 flex justify-center items-center max-w-[740px]',
  submit: 'w-[200px] h-[50px] bg-[#119F86] text-[#0F1B0E] rounded-full flex justify-center items-center text-lg font-bold cursor-pointer hover:bg-[#063930] transition duration-300 ease-in-out',

};

const Page = () => {
  // Sample data - replace with real data from your backend
  const tasks = [
    { id: 1, name: 'Client onboarding', status: 'done' },
    { id: 2, name: 'Monthly report', status: 'pending' },
    { id: 3, name: 'Bug fixes', status: 'in-progress' }
  ];

  const timeLeft = '02:45:30'; // HH:MM:SS format
  const unreadMessages = 3;
  const schedule = [
    { time: '09:00 - 11:00', event: 'Team standup' },
    { time: '14:00 - 15:00', event: 'Client meeting' }
  ];
  const availability = 'available'; // or 'busy', 'in-meeting'
  const urgentTasks = [
    'Server maintenance (ASAP)',
    'CEO presentation (Today 5PM)'
  ];

  return (
    <div className={classes.Main}> 
      <div className={classes.EmployeeContainer}>
        <div className={classes.LogoContainer}>
          <div className={classes.Logo}>
            <Image src={logo} alt="logo" className={classes.Logo} priority />
          </div>
        </div>
        <div className="text-[#AACBB8]  qurova text-[28px] -mb-20 font-bold mb-4">Welcome Rohith!</div>
        <div className={classes.EmployeeCardsContainer}>
         
          {/* Tasks Card */}
<div className={classes.EmployeeCards}>
  <div className={classes.CardInner}>
    <div className={classes.CardTitle}>Tasks</div>
    <div className={`${classes.CardComponent} gap-2`}>
      <div className="text-green-400 text-sm w-full flex justify-between">
        <span>✅ Done:</span>
        <span>{tasks.filter(task => task.status === 'done').length}</span>
      </div>
      <div className="text-yellow-400 text-sm w-full flex justify-between">
        <span>🕒 Pending:</span>
        <span>{tasks.filter(task => task.status === 'pending').length}</span>
      </div>
      <div className="text-blue-400 text-sm w-full flex justify-between">
        <span>🔄 In Progress:</span>
        <span>{tasks.filter(task => task.status === 'in-progress').length}</span>
      </div>
    </div>
  </div>
</div>


          {/* Time Tracker Card */}
          <div className={classes.EmployeeCards}>
            <div className={classes.CardInner}>
              <div className={classes.CardTitle}>Time Tracker</div>
              <div className={classes.CardComponent}>
                <div className={classes.TimeDisplay}>{timeLeft}</div>
                <div className="text-[#AACBB8] text-sm mt-2">Current Task:</div>
                <div className="text-[#AACBB8] text-xs">Monthly Report</div>
                <button className="mt-4 px-4 py-1 bg-[#119F86] text-[#0F1B0E] rounded-full text-sm">
                  {timeLeft === '00:00:00' ? 'Start Task' : 'Pause'}
                </button>
              </div>
            </div>
          </div>

          {/* Team Chat Card */}
          <div className={classes.EmployeeCards}>
            <div className={classes.CardInner}>
              <div className={classes.CardTitle}>Team Chat</div>
              <div className={`${classes.CardComponent} gap-4`}>
                <div className="flex items-center gap-2">
                  <div className={classes.ChatBubble} />
                  <span className="text-[#AACBB8] text-sm">
                    {unreadMessages} new messages
                  </span>
                </div>
                <div className="text-[#AACBB8] text-xs text-center">
                  Last message: "Need help with client onboarding"
                </div>
                <button className="px-4 py-1 bg-[#119F86] text-[#0F1B0E] rounded-full text-sm">
                  Open Chat
                </button>
              </div>
            </div>
          </div>

          {/* My Schedule Card */}
          <div className={classes.EmployeeCards}>
            <div className={classes.CardInner}>
              <div className={classes.CardTitle}>My Schedule</div>
              <div className={`${classes.CardComponent} gap-2`}>
                {schedule.map((item, index) => (
                  <div key={index} className={classes.ScheduleItem}>
                    <div className="font-bold">{item.time}</div>
                    <div>{item.event}</div>
                  </div>
                ))}
                <button className="mt-2 px-4 py-1 bg-[#119F86] text-[#0F1B0E] rounded-full text-sm">
                  View Full Schedule
                </button>
              </div>
            </div>
          </div>

          {/* Availability Card */}
          <div className={classes.EmployeeCards}>
            <div className={classes.CardInner}>
              <div className={classes.CardTitle}>Availability</div>
              <div className={`${classes.CardComponent} gap-4`}>
                <div className="flex items-center gap-2">
                  <div className={`${classes.StatusIndicator} ${
                    availability === 'available' ? 'bg-green-500' : 
                    availability === 'busy' ? 'bg-red-500' : 'bg-yellow-500'
                  }`} />
                  <span className="text-[#AACBB8] text-sm capitalize">
                    {availability}
                  </span>
                </div>
                <select 
                  className="bg-[#063930] text-[#AACBB8] text-sm rounded px-2 py-1"
                  value={availability}
                  onChange={(e) => console.log('Status changed:', e.target.value)}
                >
                  <option value="available">Available</option>
                  <option value="busy">Busy</option>
                  <option value="in-meeting">In Meeting</option>
                </select>
              </div>
            </div>
          </div>

          {/* Urgent Tasks Card */}
          <div className={classes.EmployeeCards}>
            <div className={classes.CardInner}>
              <div className={classes.CardTitle}>Urgent Tasks</div>
              <div className={`${classes.CardComponent} gap-2`}>
                {urgentTasks.map((task, index) => (
                  <div key={index} className={classes.UrgentTask}>
                    ⚠️ {task}
                  </div>
                ))}
                <button className="mt-2 px-4 py-1 bg-red-500 text-white rounded-full text-sm">
                  Acknowledge All
                </button>
              </div>
            </div>
          </div>
        </div>
        <div className={classes.submitSection}> <div className={classes.submit}>Submit</div></div>
      </div>
    </div>
  );
};

export default Page;