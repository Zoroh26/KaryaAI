'use client';
import React from 'react';
import Image from 'next/image';
import { CircularProgressbar, buildStyles } from 'react-circular-progressbar';
import 'react-circular-progressbar/dist/styles.css';
import logo from '../../../public/images/logo1.svg';
import '../globals.css';

const classes = {
  Main: 'w-full h-full flex justify-center items-center bg-[#0F1B0E]',
  AdminBox: 'w-full max-w-[960px] h-full flex flex-col justify-center items-center p-4 gap-6',
  LogoContainer: 'w-full h-16 flex mb-4 justify-center mt-6 items-center',
  Logo: 'object-contain h-24 w-full -ml-3',
  GreetingBox: 'w-full flex flex-col gap-2 -mt-4 items-start gap-4',
  Greeting: 'text-[#AACBB8] text-[40px] qurova font-bold leading-none',
  Info: 'text-[#AACBB8] text-[24px] mt-2 qurova leading-none',
  taskSection: 'w-full flex flex-col gap-12 items-start',
  Taskbox: 'w-full p-6 rounded-2xl flex flex-col gap-6 items-start bg-[#063930]',
  TaskNumber: 'text-[#AACBB8] text-[24px] qurova font-bold leading-none',
  TaskName: 'text-[#AACBB8] text-[24px] qurova leading-none',
  taskBento1: 'w-full h-[180px] flex flex-row gap-4 items-start',
  TaskDescription: 'w-[70%] h-[180px] bg-[#198572] text-[#AACBB8] text-[20px] qurova leading-none rounded-3xl px-8 py-5',
  NumberOfPeople: 'w-[30%] h-[180px] bg-[#198572] text-[#AACBB8] flex flex-col py-6 gap-6 text-[24px] qurova leading-none rounded-3xl px-4',
  taskBento2: 'w-full flex h-[330px] flex gap-4 items-start',
  EmployeeTable: 'w-[60%] h-[330px] bg-[#198572] text-[#AACBB8] text-[24px] qurova leading-none rounded-3xl px-4 overflow-y-auto scrollbar-hide',
  DeadlineAndProgress: 'w-[40%] h-[330px] flex flex-col gap-4 items-start',
  Deadline: 'w-full h-[50px] bg-[#198572] font-bold text-[#AACBB8] text-[22px] qurova leading-none rounded-3xl pl-16 py-4',
  Progress: 'w-full h-[260px] bg-[#198572] flex flex-col gap-3 justify-center items-center rounded-3xl',
};

const Page = () => {
  // Employee data array
  const employees = [
    { id: 1, name: 'John Doe', department: 'Engineering' },
    { id: 2, name: 'Jane Smith', department: 'Marketing' },
    { id: 3, name: 'Alice Johnson', department: 'Human Resources' },
    { id: 4, name: 'Bob Brown', department: 'Finance' },
    { id: 5, name: 'Emily Davis', department: 'IT' },
    { id: 6, name: 'Michael Wilson', department: 'Operations' },
    { id: 7, name: 'Sarah Lee', department: 'Legal' },
    { id: 8, name: 'Chris Green', department: 'Sales' },
  ];

  const progressValue = 60; // Dummy progress value (60%)

  return (
    <div className={classes.Main}>
      <div className={classes.AdminBox}>
        <div className={classes.LogoContainer}>
          <Image src={logo} alt="logo" className={classes.Logo} priority />
        </div>
        <div className={classes.GreetingBox}>
          <div className={classes.Greeting}>Hello Admin,</div>
          <div className={classes.Info}>Here’s the received tasks from clients.</div>
        </div>
        <div className={classes.taskSection}>
          <div className={classes.Taskbox}>
            <div className={classes.TaskNumber}>
              Task <span className="font-serif">1</span>
            </div>
            <div className={classes.TaskName}>Task Name: Flutter Flow</div>
            <div className={classes.taskBento1}>
              <div className={classes.TaskDescription}>
                AI-driven workforce scheduler for government agencies. Automates task allocation based on employee
                skills, availability, and priority levels. Features real-time adjustments, conflict resolution, and
                compliance tracking. Integrates with existing HR systems via API. Designed to reduce scheduling errors
                by <span className="font-serif">60%</span> in public sector organizations
              </div>
              <div className={classes.NumberOfPeople}>
                <div className="text-[24px] w-full text-center qurova font-bold">Number of Employees Required</div>
                <div className="font-serif w-full text-center text-[28px]">9</div>
              </div>
            </div>
            <div className={classes.taskBento2}>
              <div className={classes.EmployeeTable}>
                <div className="text-[20px] text-center mt-6 qurova font-bold mb-4">Employee Table</div>
                <table className="w-full text-[#AACBB8] text-left border-collapse">
                  <thead>
                    <tr className="border-b border-[#AACBB8]">
                      <th className="py-2 px-4">Employee ID</th>
                      <th className="py-2 px-4">Employee Name</th>
                      <th className="py-2 px-4">Employee Department</th>
                    </tr>
                  </thead>
                  <tbody>
                    {employees.map((employee) => (
                      <tr key={employee.id} className="border-b border-[#AACBB8]">
                        <td className="py-2 px-4 font-serif ">{employee.id}</td>
                        <td className="py-2 px-4">{employee.name}</td>
                        <td className="py-2 px-4">{employee.department}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className={classes.DeadlineAndProgress}>
                <div className={classes.Deadline}>
                  Deadline : <span className="font-serif font bold">26-10-2025</span>
                </div>
                <div className={classes.Progress}>
                  <div className="text-[24px] w-full text-[#AACBB8] text-center qurova font-bold">Task Progress</div>
                  <div className='w-[170px] h-[170px]'><CircularProgressbar
                    value={progressValue}
                    text={`${progressValue}%`}
                    styles={buildStyles({
                      textColor: '#AACBB8',
                      pathColor: '#119F86',
                      trailColor: '#063930',
                      textSize: '16px',
                    })}
                  /></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Page;