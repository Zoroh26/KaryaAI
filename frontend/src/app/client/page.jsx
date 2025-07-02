'use client';
import React, { useState } from 'react';
import Image from 'next/image';
import axios from 'axios';
import logo from '../../../public/images/logo1.svg';

const classes = {
  Main: 'w-full h-screen flex justify-center items-center bg-[#0F1B0E]',
  ClientBox: 'w-full max-w-[960px] h-full flex flex-col justify-center items-center p-4 gap-6',
  LogoContainer: 'w-full h-16 flex mb-4 justify-center items-center',
  Logo: 'object-contain h-24 w-full -ml-3',
  GreetingBox: 'w-full flex flex-col gap-2 items-start gap-4',
  Greeting: 'text-[#AACBB8] text-[40px] qurova font-bold leading-none',
  Info: 'text-[#AACBB8] text-[24px] mt-2 qurova leading-none',
  SpecificationSection: 'w-full flex flex-col gap-12 items-start',
  SpecificationTitle: 'text-[#AACBB8] text-[32px] qurova leading-none font-bold mt-4',
  Question1: 'w-full flex flex-col gap-4 items-start',
  Question1Title: 'text-[#AACBB8] text-[24px] qurova leading-none',
  Question1InputContainer: 'w-full flex flex-col gap-2 items-start mt-2',
  Question1Input: 'w-full h-40 bg-[#052A04] text-[#AACBB8] text-[20px]  leading-none rounded-xl p-4 resize-none',
  submitButton: 'w-[200px] h-[50px] bg-[#119F86] text-[#0F1B0E] rounded-full flex justify-center items-center text-lg font-bold cursor-pointer hover:bg-[#063930] transition duration-300 ease-in-out',
};

const Page = () => {
  const [text, setText] = useState(''); // State to store input text
  const [review, setReview] = useState(''); // State to store the API response

  async function handleClient() {
    try {
      const response = await axios.post('http://localhost:3000/ai/get-review', { text });
      console.log('Raw Response:', response.data); // Log the raw response from the server

      // Clean and parse the JSON response
      const cleanedResponse = response.data.replace(/```json|```/g, '').trim(); // Remove any markdown formatting
      const parsedResponse = JSON.parse(cleanedResponse); // Parse the cleaned JSON

      console.log('Parsed Response:', parsedResponse); // Log the parsed response
      setReview(parsedResponse); // Update the review state with the parsed response

      // Save the parsed response to a local JSON file
      const fileData = new Blob([JSON.stringify(parsedResponse, null, 2)], { type: 'application/json' });
      const fileURL = URL.createObjectURL(fileData);
      const link = document.createElement('a');
      link.href = fileURL;
      link.download = 'review.json';
      link.click();

      return parsedResponse; // Return the parsed object
    } catch (error) {
      console.error('Error posting data or parsing response:', error.message);
    }
  }

  return (
    <div className={classes.Main}>
      <div className={classes.ClientBox}>
        <div className={classes.LogoContainer}>
          <Image src={logo} alt="logo" className={classes.Logo} priority />
        </div>
        <div className={classes.GreetingBox}>
          <div className={classes.Greeting}>Hello Rohith,</div>
          <div className={classes.Info}>
            To get more specifications of the project, let’s cover a few quick questions.
          </div>
        </div>
        <div className={classes.SpecificationSection}>
          <div className={classes.SpecificationTitle}>Project Specifications</div>
          <div className={classes.Question1}>
            <div className={classes.Question1Title}>
              Please give a detailed description of the project, including the purpose, target audience, and any specific features or functionalities you want to include.
            </div>
            <div className={classes.Question1InputContainer}>
              <textarea
                className={classes.Question1Input}
                placeholder="Enter your answer here..."
                value={text} // Bind input value to state
                onChange={(e) => setText(e.target.value)} // Update state on input change
              />
            </div>
          </div>
          <div className={classes.submitButton} onClick={handleClient}>
            Submit
          </div>
          
        </div>
      </div>
    </div>
  );
};

export default Page;