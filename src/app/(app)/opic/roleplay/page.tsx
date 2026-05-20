'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import {
  MessageSquare, Phone, Wrench, CalendarClock, AlertTriangle,
  Info, Lightbulb, Mic, MicOff, Square, ChevronLeft, ChevronRight,
  Volume2, VolumeX, CheckCircle2, Star, ArrowRight, HelpCircle,
  MessageCircle, ChevronUp, ChevronDown, Shuffle, Home, ShoppingCart,
  Coffee, Smartphone, Ticket, Clapperboard,
} from 'lucide-react';
import { useTTS, useSpeechRecognition } from '@/hooks/useSpeech';

/* ─── Types ───────────────────────────────────────────────────────── */
type AnswerLevel = 'IM' | 'IH' | 'AL';

interface RoleplayStep {
  questionVariants: string[];   // multiple variants — one is randomly selected
  context: string;
  sampleAnswers: { IM: string; IH: string; AL: string };
}

interface RoleplayScenario {
  id: string;
  title: string;
  titleKo: string;
  icon: typeof Phone;
  color: string;
  bgColor: string;
  borderColor: string;
  description: string;
  descriptionKo: string;
  tag?: string;
  steps: RoleplayStep[];
  keyExpressions: { english: string; korean: string }[];
}

/* ═══════════════════════════════════════════════════════════════════
   SCENARIO DATA
═══════════════════════════════════════════════════════════════════ */
const scenarios: RoleplayScenario[] = [
  /* ── 1. Phone Inquiry ── */
  {
    id: 'phone-inquiry',
    title: 'Phone Inquiry',
    titleKo: '전화로 문의하기',
    icon: Phone,
    color: 'text-blue-400',
    bgColor: 'bg-blue-500/10',
    borderColor: 'border-blue-500/20',
    description: 'You need to call a business to ask about their services, availability, or pricing.',
    descriptionKo: '업체에 전화해서 서비스, 이용 가능 여부, 가격에 대해 문의하세요.',
    steps: [
      {
        questionVariants: [
          'You want to sign up for a gym membership. Call the gym and ask about their plans and prices.',
          'You are interested in joining a fitness club. Call and ask 3-4 questions about their membership options and facilities.',
          'You want to find a gym near your home. Call and ask about their membership fees, class schedules, and facilities.',
        ],
        context: 'Start by greeting and stating your purpose for calling.',
        sampleAnswers: {
          IM: "Hello, I want to join your gym. How much is the membership? Do you have a monthly plan? What time does the gym open and close? Thank you.",
          IH: "Hi, I'm calling to inquire about gym membership options. Could you walk me through the different plans you offer? I'm particularly interested in monthly memberships. Also, what are your operating hours, and do you have personal training services available?",
          AL: "Good afternoon, I hope I'm not catching you at a busy time. I'm interested in becoming a member at your facility. Before I commit, I'd love to understand the full range of membership options you offer. I'm curious about the differences between your monthly and annual plans, any initiation fees, and whether you offer any trial periods. Additionally, I'd like to know about your class schedule — I'm particularly interested in yoga and HIIT classes.",
        },
      },
      {
        questionVariants: [
          'The gym tells you about their plans. Now ask follow-up questions about facilities and classes.',
          'Ask more specific questions about the pool, sauna, group classes, and parking.',
          'You want to know about the gym\'s personal training, nutrition coaching, and cancellation policy.',
        ],
        context: 'Show interest and ask detailed questions.',
        sampleAnswers: {
          IM: "That sounds good. Do you have a swimming pool? What classes do you offer? Can I bring a friend? Is there parking available?",
          IH: "That's very helpful, thank you. I have a few more questions. Do your facilities include a swimming pool and sauna? I'm also wondering about the variety of group classes — specifically, do you offer yoga and spinning? And is there an additional charge for those, or are they included in the membership?",
          AL: "That all sounds quite reasonable. I do have a few more questions, if you don't mind. I'm curious about the full scope of your facilities — specifically, do you have a swimming pool, sauna, and dedicated stretching area? For group classes, I'd love to know about the schedule variety. Are there early morning options for those of us with 9-to-5 schedules? Also, what's your policy on freezing a membership if I need to travel for an extended period?",
        },
      },
      {
        questionVariants: [
          'You decide to sign up. Finalize the details and ask about the registration process.',
          'Ask about current promotions, referral discounts, and what to bring on your first day.',
          'Confirm everything and ask how to sign up today.',
        ],
        context: 'Make your decision and handle the registration.',
        sampleAnswers: {
          IM: "I want to sign up for the monthly plan. What do I need to bring? Can I start today? Do you accept credit cards?",
          IH: "I've decided to go with the monthly premium plan. What documents do I need to bring for registration? I was also wondering if there are any ongoing promotions — a friend mentioned something about a referral discount. When would be a good time to come in and complete the signup?",
          AL: "I'm sold — I'd like to go ahead with the annual premium membership. Before I come in, could you let me know what I'll need to bring for the registration process? I'd also like to take advantage of any current promotions, and my friend who's already a member mentioned there might be a referral bonus for both of us. Would it be possible to schedule an orientation session and perhaps a complimentary personal training consultation as part of the onboarding?",
        },
      },
    ],
    keyExpressions: [
      { english: "I'm calling to inquire about...", korean: "...에 대해 문의하려고 전화했습니다" },
      { english: "Could you walk me through...?", korean: "...에 대해 설명해 주시겠어요?" },
      { english: "I'm particularly interested in...", korean: "특히 ...에 관심이 있습니다" },
      { english: "Is there an additional charge for...?", korean: "...에 추가 비용이 있나요?" },
      { english: "What are my options for...?", korean: "...에 대한 선택지가 뭐가 있나요?" },
    ],
  },

  /* ── 2. Problem Solving ── */
  {
    id: 'problem-solving',
    title: 'Problem Solving',
    titleKo: '문제 해결하기',
    icon: Wrench,
    color: 'text-orange-400',
    bgColor: 'bg-orange-500/10',
    borderColor: 'border-orange-500/20',
    description: 'Something has gone wrong and you need to resolve the issue by communicating with someone.',
    descriptionKo: '문제가 발생했고, 상대방과 소통하여 문제를 해결해야 합니다.',
    steps: [
      {
        questionVariants: [
          'You ordered a laptop online but received a tablet instead. Call customer service to explain the problem.',
          'You ordered a pair of shoes online but received the wrong size. Call customer service and explain the issue.',
          'You bought a new phone but the screen is cracked when it arrived. Call customer service to report the problem.',
        ],
        context: 'Clearly explain what happened and what you expected.',
        sampleAnswers: {
          IM: "Hello, I have a problem with my order. I ordered a laptop but I got a tablet. My order number is 12345. Can you help me? I want to get the right product.",
          IH: "Hi, I'm calling about an issue with a recent order. I placed an order for a laptop model X500 last week, and it arrived today, but unfortunately, I received a tablet instead. My order number is 12345. I've double-checked my order confirmation, and it clearly shows the laptop. Could you please look into this and arrange for the correct item to be sent?",
          AL: "Good morning, I'm reaching out regarding a rather frustrating mix-up with my recent order. I purchased a laptop — specifically the X500 Pro model — through your website last Wednesday, and the package arrived this morning. However, upon opening it, I discovered that I'd been sent a tablet instead. I have the order confirmation email right in front of me, and it clearly states the laptop. My order number is 12345. I'm hoping we can resolve this quickly, as I actually need the laptop for a work presentation next week.",
        },
      },
      {
        questionVariants: [
          'Customer service asks for more details. Provide information and express what resolution you want.',
          'The representative asks about the date and payment method. Provide the details and state the outcome you expect.',
          'Give details about your order and clearly explain the compensation or solution you are seeking.',
        ],
        context: 'Give specific details and state your desired outcome clearly.',
        sampleAnswers: {
          IM: "Yes, I ordered it on March 5th. I paid by credit card. I want to return this and get my laptop. Can you send me a return label?",
          IH: "Sure, I can provide more details. The order was placed on March 5th, and I used my Visa card ending in 4532. The item I received appears to be a Samsung Galaxy Tab, which is clearly not what I ordered. Ideally, I'd like to return this incorrect item at no cost to me and have the correct laptop shipped out as soon as possible. Would it be possible to expedite the shipping?",
          AL: "Absolutely. The order was placed on March 5th, payment was made via Visa ending in 4532, and the tracking number is KR12345678. The item I received is a Samsung Galaxy Tab in its original packaging — so it appears to be a warehouse picking error rather than a shipping mix-up. Here's what I'd ideally like to happen: I'd like a prepaid return label for this tablet, and I'd like the correct laptop to be shipped out via express delivery at your expense, given the inconvenience.",
        },
      },
      {
        questionVariants: [
          'They offer a solution. Respond and confirm the resolution details.',
          'The company offers a partial refund. Negotiate if needed and confirm the final solution.',
          'Agree on a resolution and ask for written confirmation of the arrangement.',
        ],
        context: 'Confirm the solution and make sure everything is clear.',
        sampleAnswers: {
          IM: "Okay, that sounds good. So you will send me a return label and a new laptop? When will I get the laptop? Thank you for your help.",
          IH: "Thank you for handling this so promptly. Just to confirm — you'll be emailing me a prepaid return label today, and once the tablet is picked up, the correct laptop will be shipped via express delivery? Can I expect it by Friday? I'd also appreciate if you could send me a confirmation email with all these details.",
          AL: "I appreciate you working with me on this. Let me just recap to make sure we're on the same page. You'll be sending a prepaid return label via email within the hour, a courier will pick up the tablet from my address tomorrow, and the correct laptop will be dispatched today via express shipping, arriving by Friday at the latest. Could you please send me a written confirmation of all these arrangements?",
        },
      },
    ],
    keyExpressions: [
      { english: "I'm calling about an issue with...", korean: "...에 관한 문제로 전화했습니다" },
      { english: "Unfortunately, I received...", korean: "안타깝게도 ...을 받았습니다" },
      { english: "I'd like to request a...", korean: "...을 요청하고 싶습니다" },
      { english: "Could you look into this?", korean: "이것 좀 확인해 주시겠어요?" },
      { english: "Just to confirm...", korean: "확인차 말씀드리면..." },
    ],
  },

  /* ── 3. Rescheduling ── */
  {
    id: 'rescheduling',
    title: 'Rescheduling',
    titleKo: '약속 변경하기',
    icon: CalendarClock,
    color: 'text-violet-400',
    bgColor: 'bg-violet-500/10',
    borderColor: 'border-violet-500/20',
    description: 'You need to change plans, reschedule an appointment, or modify a reservation.',
    descriptionKo: '계획을 변경하거나, 약속을 다시 잡거나, 예약을 수정해야 합니다.',
    steps: [
      {
        questionVariants: [
          'You have a dinner reservation for Saturday at 7 PM, but you need to change it to Sunday. Call the restaurant.',
          'You booked a yoga class for tomorrow, but something came up. Call the studio to reschedule.',
          'You have a doctor\'s appointment on Wednesday, but need to change it. Call the clinic and reschedule.',
        ],
        context: 'Apologize for the change and clearly state what you need.',
        sampleAnswers: {
          IM: "Hello, I have a reservation for Saturday at 7 PM. My name is Kim. I need to change it to Sunday. Is Sunday okay? Same time, 7 PM.",
          IH: "Hi, I'm calling to modify a dinner reservation I have for this Saturday at 7 PM under the name Kim. Unfortunately, something has come up and I need to move it to Sunday instead. Would you have availability for a party of four at the same time on Sunday evening?",
          AL: "Good afternoon, I'm calling to see if it would be possible to adjust a reservation I made for this Saturday. It's under Kim for a party of four at 7 PM. Unfortunately, a work commitment has come up that I can't avoid, so I was hoping to move our dinner to Sunday evening instead. I realize this might be a busy night for you, so I'm flexible with the time — anywhere between 6:30 and 8 would work perfectly for us.",
        },
      },
      {
        questionVariants: [
          'The restaurant says Sunday at 7 PM is full. Negotiate an alternative time or solution.',
          'Your preferred time slot is unavailable. Suggest alternatives and find a workable solution.',
          'The time you want is taken. Ask about other available options on different days.',
        ],
        context: 'Be flexible and suggest alternatives.',
        sampleAnswers: {
          IM: "Oh, 7 PM is not available? What about 6 PM or 8 PM? Any time on Sunday is okay for me.",
          IH: "I see, that's unfortunate. Would there be anything available earlier, say around 6 or 6:30? Alternatively, I'd be okay with a later time like 8 PM. If Sunday is completely booked, could you put us on a waitlist? Or perhaps you have availability on Monday evening?",
          AL: "I understand, Sunday evenings are quite popular. Let me be more flexible — would there be an opening for an earlier seating, perhaps around 5:30 or 6? We wouldn't mind having an earlier dinner if that's what's available. Alternatively, if there's nothing on Sunday, I'd consider Monday evening. Also, since we're celebrating a birthday, I wonder if your private dining area might have different availability?",
        },
      },
      {
        questionVariants: [
          'You found a new time that works. Confirm all the details.',
          'Agree on the new time and ask about any special arrangements for the occasion.',
          'Finalize the rescheduled booking and ask about cancellation policy just in case.',
        ],
        context: 'Confirm every detail to avoid further issues.',
        sampleAnswers: {
          IM: "Great, Sunday at 6 PM is good. For four people. Under Kim. Thank you very much!",
          IH: "Perfect, let's go with Sunday at 6 PM for four people. The reservation will still be under Kim. And just to mention — it's actually a birthday celebration, so if there's anything special you could arrange, like a cake or a decorated table, that would be wonderful. What's your cancellation policy, just in case?",
          AL: "Wonderful, Sunday at 6 PM works perfectly. So just to make sure everything is noted correctly: party of four, under Kim, this Sunday at 6 PM. As I mentioned, it's a birthday celebration for my wife, so I was wondering if you offer any special arrangements — perhaps a birthday dessert plate, or could we pre-order a cake? And finally, could I get a confirmation number or have you send a confirmation to my email?",
        },
      },
    ],
    keyExpressions: [
      { english: "I need to reschedule/modify...", korean: "...을 변경/수정해야 합니다" },
      { english: "Something has come up and...", korean: "일이 생겨서..." },
      { english: "Would there be availability for...?", korean: "...에 자리가 있을까요?" },
      { english: "I'm flexible with the time.", korean: "시간은 유연하게 맞출 수 있어요." },
      { english: "Just to confirm the details...", korean: "세부사항을 확인하자면..." },
    ],
  },

  /* ── 4. Making a Complaint ── */
  {
    id: 'complaint',
    title: 'Making a Complaint',
    titleKo: '불만 제기하기',
    icon: AlertTriangle,
    color: 'text-red-400',
    bgColor: 'bg-red-500/10',
    borderColor: 'border-red-500/20',
    description: 'You are unsatisfied with a service or product and need to express your dissatisfaction.',
    descriptionKo: '서비스나 제품에 불만족하며, 불만을 표현하고 해결책을 찾아야 합니다.',
    steps: [
      {
        questionVariants: [
          'You stayed at a hotel and the room was not as advertised — noisy, AC broken, dirty. Call to complain.',
          'You booked a restaurant for a special occasion but the service and food were terrible. Call and complain.',
          'You hired a cleaning service but they did a poor job and broke something. Call and lodge a complaint.',
        ],
        context: 'Be firm but polite while explaining the issues.',
        sampleAnswers: {
          IM: "Hello, I stayed at your hotel last weekend. I have some complaints. My room was very noisy and dirty. Also, the air conditioner was broken. I am not happy with my stay.",
          IH: "Hi, I'm calling to express my dissatisfaction with my recent stay at your hotel. I checked in last Friday and stayed through Sunday in room 405. The room was noticeably dirty when I arrived, the air conditioning wasn't functioning properly, and there was constant noise from what seemed like construction next door. I think this warrants some form of compensation.",
          AL: "Good morning, I'm reaching out regarding what was, unfortunately, a rather disappointing experience during my recent stay. I was in room 405 from Friday through Sunday, and I have to say, there was a significant gap between what was advertised and the reality. The room had clearly not been properly cleaned, the air conditioning unit was malfunctioning, and there was persistent construction noise. The lack of proactive response from your staff when I reported these problems was equally concerning.",
        },
      },
      {
        questionVariants: [
          'The business apologizes and asks what resolution you would like. State your expectations clearly.',
          'They ask what compensation you expect. Be specific about what you want.',
          'Explain exactly what you think is fair given the circumstances.',
        ],
        context: 'Be specific about what compensation you expect.',
        sampleAnswers: {
          IM: "I think I should get some money back. The room was not good. Maybe 50% refund? Or a free night for next time?",
          IH: "I appreciate the apology, but I think the situation calls for more than words. Given the multiple issues — the cleanliness, the broken AC, and the noise — I believe a partial refund is warranted. Specifically, I think a 50% refund on my total stay would be fair. Alternatively, I'd accept a complimentary two-night stay with a room upgrade for a future visit.",
          AL: "Thank you for acknowledging the issues. Given the extent of the problems — which essentially affected the entirety of my two-night stay — I believe a reasonable resolution would be a full refund for one of the two nights, along with a complimentary future stay in an upgraded room. I think this is fair given that I paid your premium rate based on the expectation of a clean, comfortable, and quiet room.",
        },
      },
      {
        questionVariants: [
          'They offer a partial resolution. Negotiate if needed and finalize.',
          'The company offers less than you expected. Push back politely and find a middle ground.',
          'Reach a final agreement and confirm the resolution.',
        ],
        context: 'Find a middle ground and close the conversation.',
        sampleAnswers: {
          IM: "A 30% refund is not enough. Can you make it 50%? And maybe add a free breakfast for next time? That would be better.",
          IH: "I understand your position, but a 30% discount feels insufficient given the extent of the issues. Would you be willing to meet in the middle — perhaps a 40% refund plus a complimentary night for my next visit? I want to be fair, but I also think the experience warranted better.",
          AL: "I appreciate the gesture, but a 30% discount doesn't fully reflect the impact on my stay. Here's what I'd propose: a 40% refund on the total bill, a complimentary one-night stay with a room upgrade for a future visit, and a direct contact for your guest relations manager should any issues arise. I want to be constructive about this — I'd like to be able to come back with confidence.",
        },
      },
    ],
    keyExpressions: [
      { english: "I'd like to express my dissatisfaction with...", korean: "...에 대한 불만을 표현하고 싶습니다" },
      { english: "The experience fell short of expectations.", korean: "기대에 미치지 못한 경험이었습니다." },
      { english: "I believe ... warrants compensation.", korean: "...은 보상을 받아야 한다고 생각합니다." },
      { english: "Would you be willing to...?", korean: "...해 주실 의향이 있으신가요?" },
      { english: "I'd like to resolve this amicably.", korean: "이 문제를 원만하게 해결하고 싶습니다." },
    ],
  },

  /* ── 5. Requesting Information ── */
  {
    id: 'requesting-info',
    title: 'Requesting Information',
    titleKo: '정보 요청하기',
    icon: Info,
    color: 'text-teal-400',
    bgColor: 'bg-teal-500/10',
    borderColor: 'border-teal-500/20',
    description: 'You need to gather information about a product, service, event, or location.',
    descriptionKo: '제품, 서비스, 이벤트 또는 장소에 대한 정보를 수집해야 합니다.',
    steps: [
      {
        questionVariants: [
          'You want to take a cooking class. Call a culinary school and ask about their programs.',
          'You want to enroll in a language class. Call a language institute and ask 3-4 questions.',
          'You are interested in a photography workshop. Call the organizer and ask about the details.',
        ],
        context: 'Ask about availability, pricing, and course details.',
        sampleAnswers: {
          IM: "Hello, I want to take a cooking class. What classes do you have? How much does it cost? When are the classes? Do I need to bring anything?",
          IH: "Hi, I'm interested in enrolling in a cooking class at your school. Could you tell me about the different programs you offer? I'm particularly interested in courses that cover Korean or Italian cuisine. I'd also like to know about the schedule, pricing, and whether any prior cooking experience is required.",
          AL: "Good afternoon, I've been thinking about pursuing my passion for cooking more seriously, and your school came highly recommended. I'd love to learn about the full range of programs you offer. Could you walk me through the different levels — from beginner to advanced? I'm also curious about the class format: is it hands-on with each student at their own station, or more demonstration-based?",
        },
      },
      {
        questionVariants: [
          'They give you information. Ask more detailed follow-up questions about a specific program.',
          'Dig deeper into one specific course — curriculum, instructor background, class size.',
          'Ask about prerequisites, materials included, and any certification upon completion.',
        ],
        context: 'Dig deeper into the details that matter to you.',
        sampleAnswers: {
          IM: "The Italian cooking class sounds interesting. How many weeks is it? How many students in one class? What will we learn to cook? Is there a certificate?",
          IH: "The Italian cuisine program sounds perfect. A few more questions: how is the 8-week curriculum structured? Do you start with basics like pasta making and progress to more complex dishes? Also, do students receive any kind of certification upon completion?",
          AL: "The Italian cuisine track sounds like exactly what I've been looking for. Could you elaborate on the curriculum structure? I'd like to know if it follows a progressive approach. Also, I'm curious about the instructor's background — do they have professional culinary experience in Italy? And is there any assessment component, or is it purely learning-focused?",
        },
      },
      {
        questionVariants: [
          'Decide to sign up and ask about the registration process and any preparation needed.',
          'Confirm enrollment and ask about payment options, start date, and what to prepare.',
          'Ask about registration deadline, payment plans, and any preparatory materials.',
        ],
        context: 'Take action and finalize your enrollment.',
        sampleAnswers: {
          IM: "I want to sign up for the Italian class. How can I register? Can I pay online? When does it start?",
          IH: "I'd love to sign up for the next Italian cuisine course. What's the registration process — can I do it online, or do I need to come in person? When does the next session start, and is there a registration deadline? Also, is there a recommended reading list?",
          AL: "I'm definitely interested in enrolling. Could you walk me through the registration process? I'd like to know about the payment options — whether you offer installment plans or early-bird discounts. Also, I'm wondering if there's a recommended reading list or any preparatory materials I should review before the course begins.",
        },
      },
    ],
    keyExpressions: [
      { english: "I'd like to learn more about...", korean: "...에 대해 더 알고 싶습니다" },
      { english: "Could you elaborate on...?", korean: "...에 대해 자세히 설명해 주시겠어요?" },
      { english: "What are the requirements for...?", korean: "...의 요건이 무엇인가요?" },
      { english: "Is there a ... option?", korean: "... 옵션이 있나요?" },
      { english: "What would you recommend for...?", korean: "...에 대해 무엇을 추천하시나요?" },
    ],
  },

  /* ── 6. Suggesting Alternatives ── */
  {
    id: 'suggesting-alternatives',
    title: 'Suggesting Alternatives',
    titleKo: '대안 제시하기',
    icon: Lightbulb,
    color: 'text-amber-400',
    bgColor: 'bg-amber-500/10',
    borderColor: 'border-amber-500/20',
    description: 'Your original plan fell through. Suggest alternative options to resolve the situation.',
    descriptionKo: '원래 계획이 무산되었습니다. 상황을 해결하기 위한 대안을 제시하세요.',
    steps: [
      {
        questionVariants: [
          'Your friend from abroad is visiting. The outdoor concert you planned got cancelled due to rain. Suggest alternatives.',
          'The restaurant you booked for your anniversary is fully booked. Suggest alternative plans to your partner.',
          'Your planned hiking trip has to be cancelled due to bad weather. Suggest other activities to your group.',
        ],
        context: 'Acknowledge the disappointment and offer exciting alternatives.',
        sampleAnswers: {
          IM: "I'm sorry, the concert is cancelled because of rain. But don't worry! We can go to a movie theater or find an indoor restaurant. What do you want to do?",
          IH: "Hey, I just got the notification — the outdoor concert has been cancelled due to the rain forecast. I'm really disappointed, but let's not let that ruin our evening. I have a couple of ideas: there's a great jazz club downtown that has a live performance tonight, or we could check out that new Korean BBQ place I've been telling you about.",
          AL: "So I just got some unfortunate news — the concert we've been looking forward to has been cancelled. I know it's disappointing, especially since you were so excited about it, but I think we can actually turn this into something equally memorable. Here's what I'm thinking: there's an incredible speakeasy-style jazz bar that hosts live performances on Friday nights. Alternatively, if you'd prefer something more cultural, there's a traditional Korean performance tonight at the National Theater.",
        },
      },
      {
        questionVariants: [
          "Your friend isn't sure about those options. Provide more details and be persuasive.",
          'They seem hesitant. Give more convincing details about your top suggestion.',
          'Elaborate on one alternative with specific details to make it more appealing.',
        ],
        context: 'Give more details to make your suggestion appealing.',
        sampleAnswers: {
          IM: "The jazz club is really nice. It has good music and the drinks are good. Many people say it's the best jazz club in Seoul. I think you will enjoy it. Let's try it!",
          IH: "I totally understand your hesitation. Let me tell you more about the jazz club — it's called Blue Note Seoul, and it's modeled after the famous New York venue. Tonight they have a trio playing classic jazz standards, and the cocktail menu is incredible. Plus, it's only a 15-minute taxi ride from here.",
          AL: "I get it — switching plans last minute can be a bit deflating. But hear me out on the jazz club idea. Blue Note Seoul has become one of the city's hidden cultural gems. It's housed in a beautifully converted hanok building, so you'll get the unique experience of listening to world-class jazz in a traditional Korean architectural setting. The trio performing tonight actually just returned from a European tour.",
        },
      },
      {
        questionVariants: [
          'Your friend agrees to one option. Make the arrangements and finalize the plan.',
          'They choose one of your suggestions. Take charge and organize the evening.',
          'Finalize the alternative plan, handle logistics, and confirm everything.',
        ],
        context: 'Take charge and organize everything smoothly.',
        sampleAnswers: {
          IM: "Great! Let me check if we need a reservation. I will call the jazz club now. We can meet at 7 PM and take a taxi there. Sound good?",
          IH: "Awesome, I'm glad you're on board! Let me call ahead and see if we need a reservation. In the meantime, let's plan to meet at the hotel lobby at 7, grab dinner at the Italian place next door around 7:30, and then head to the jazz club for the 9 PM show. I'll handle the reservation.",
          AL: "Excellent choice! Let me take care of all the logistics. I'll call Blue Note right now to reserve a table with good stage visibility. Here's what I'm thinking for the timeline: let's meet at your hotel at 7, walk over to Trattoria di Sergio for dinner — their truffle pasta is legendary — have a leisurely dinner, then stroll over to the jazz club for the 9 PM set. I'll make both reservations and send you all the details.",
        },
      },
    ],
    keyExpressions: [
      { english: "I have a few alternatives in mind.", korean: "몇 가지 대안이 있어요." },
      { english: "How about we ... instead?", korean: "대신 ...하는 건 어떨까요?" },
      { english: "Let me tell you more about...", korean: "...에 대해 더 말씀드릴게요." },
      { english: "Trust me, you'll love it.", korean: "저를 믿으세요, 좋아할 거예요." },
      { english: "Let me take care of the arrangements.", korean: "제가 준비를 맡을게요." },
    ],
  },

  /* ══════════════════════════════════════════════════════════════════
     OPIc Q11-Q13 AUTHENTIC SCENARIOS
  ══════════════════════════════════════════════════════════════════ */

  /* ── 7. Buying a House (OPIc) ── */
  {
    id: 'opic-house',
    title: 'Buying a House',
    titleKo: '집 구매하기',
    icon: Home,
    tag: 'OPIc Q11-13',
    color: 'text-emerald-400',
    bgColor: 'bg-emerald-500/10',
    borderColor: 'border-emerald-500/20',
    description: 'Q11-13 scenario: Call a real estate agent to inquire, then handle a problem, then share a past experience.',
    descriptionKo: 'Q11~13: 부동산 에이전트에게 문의 → 문제 해결 → 과거 경험 이야기',
    steps: [
      {
        questionVariants: [
          "You are looking for a new house to buy. Call a real estate agent and ask 3 or 4 questions about the property.",
          "Imagine you want to purchase a new apartment. Call a real estate agent and ask 3-4 questions to find out more about it.",
          "You've seen a property listing online and want more details. Call the agent and ask about the house.",
        ],
        context: 'Ask about price, location, size, age of building, nearby facilities, and additional fees.',
        sampleAnswers: {
          IM: "Hello, I'm interested in the house you have listed. How much does it cost? How many bedrooms does it have? Is it close to a subway station? Is there parking available?",
          IH: "Hi, I'm calling about the apartment you have listed. I have a few questions. First, what's the asking price and is there room for negotiation? Also, how many square meters is it, and which floor is it on? I'm wondering about the neighborhood — are there good schools and grocery stores nearby? And are there any additional maintenance fees I should know about?",
          AL: "Good afternoon, I came across your property listing and I'm quite interested. Before I schedule a viewing, I'd like to ask a few questions. Could you tell me about the asking price and whether there's any flexibility? I'm also curious about the building's age and when the last renovation was done. Additionally, could you give me a sense of the neighborhood? Specifically, proximity to public transportation and the quality of local schools. Are there any other costs beyond the purchase price, such as maintenance fees or parking charges?",
        },
      },
      {
        questionVariants: [
          "You just moved in, but discovered the ceiling leaks when it rains. Call the agent and explain the situation. Ask for 2-3 solutions.",
          "After moving in, you found out the neighbors are extremely noisy. Call the agent, describe the problem, and ask for 2 or 3 alternatives.",
          "You moved in and found the heating system is broken. Call the real estate agent and ask for solutions.",
        ],
        context: 'Describe the problem clearly and ask for specific, actionable solutions.',
        sampleAnswers: {
          IM: "Hello, I have a problem with the house I just bought. The ceiling is leaking. This was not a problem before I bought it. Can you help me? What can I do? Can you fix it or give me some money back?",
          IH: "Hi, I'm calling about the house I purchased last week. I've discovered there's a significant leak in the ceiling whenever it rains. This was definitely not disclosed during the sale, and it's causing damage to my belongings. I'd like to know what options I have. Can the previous owner or the agency cover the repair costs? Or should I contact my insurance company? I need this resolved quickly.",
          AL: "Good morning, I'm reaching out about an urgent issue with the property I recently purchased through your agency. I've discovered that the ceiling has a significant leak that appears when it rains — clearly not disclosed during the sale. I've already incurred some damage to my furniture and flooring. I'd like to understand my options. Does your agency have any liability given that this defect wasn't disclosed? Is there a warranty covering structural issues? And what's the fastest way to get this remediated? I'd appreciate specific contractors you can recommend.",
        },
      },
      {
        questionVariants: [
          "Tell me about a memorable experience you had when you moved to a new place. What happened?",
          "Have you ever had a problem with a house or apartment you lived in? Tell me about what happened.",
          "Tell me about a time you or someone you know had a difficult situation related to housing.",
        ],
        context: 'Share a detailed past experience — describe what happened, how you felt, and how it was resolved.',
        sampleAnswers: {
          IM: "Yes, I remember when I moved to my current apartment. It was very stressful. I had to carry many boxes and the elevator was broken. It was tiring but I was happy when I finished.",
          IH: "Actually, I had quite an interesting experience when I moved into my first apartment a few years ago. On moving day, I discovered that the previous tenant had left the place in terrible condition — stains on the walls, a broken refrigerator, and a strange smell. I had to negotiate with the landlord for compensation. It taught me to always do a thorough inspection before signing any paperwork.",
          AL: "My most memorable housing experience happened when I was moving into my very first independent apartment. I had done everything right — viewed the property, read the lease carefully. But on the actual moving day, I discovered that the previous occupant had been a smoker, and the walls had absorbed years of cigarette odor. The negotiation that followed was my first real lesson in assertive communication. I had to research my tenant rights, document everything, and present a clear case for why the landlord was obligated to repaint and professionally clean the unit. We eventually reached an agreement, and it was an invaluable experience in self-advocacy.",
        },
      },
    ],
    keyExpressions: [
      { english: "I'm calling about the property listed at...", korean: "...에 등록된 매물에 대해 전화드립니다" },
      { english: "Is there any room for negotiation on the price?", korean: "가격 협상의 여지가 있나요?" },
      { english: "This was not disclosed during the sale.", korean: "이것은 거래 시 공개되지 않았습니다" },
      { english: "What are my options here?", korean: "제가 선택할 수 있는 방법이 있나요?" },
      { english: "Could you recommend a reliable contractor?", korean: "믿을 만한 시공업자를 추천해 주실 수 있나요?" },
    ],
  },

  /* ── 8. Buying Movie Tickets (OPIc) ── */
  {
    id: 'opic-movie',
    title: 'Movie Tickets',
    titleKo: '영화 티켓 구매',
    icon: Clapperboard,
    tag: 'OPIc Q11-13',
    color: 'text-pink-400',
    bgColor: 'bg-pink-500/10',
    borderColor: 'border-pink-500/20',
    description: 'Q11-13: Call the cinema to ask about showings → tickets are sold out → share a movie experience.',
    descriptionKo: 'Q11~13: 영화관 문의 → 매진 문제 해결 → 영화 관람 경험 이야기',
    steps: [
      {
        questionVariants: [
          "You want to watch a movie with your friend this weekend. Call the movie theater and ask 3-4 questions about what's showing.",
          "You'd like to take your family to the movies. Call the cinema and ask 3 or 4 questions about the current schedule and available seats.",
          "Call a movie theater and ask about their current movie schedule, ticket prices, and available seats for this Saturday.",
        ],
        context: 'Ask about what movies are showing, times, ticket prices, and seat availability.',
        sampleAnswers: {
          IM: "Hello, I want to watch a movie this Saturday. What movies do you have? What time does the last show start? How much are the tickets? Are there any discounts?",
          IH: "Hi, I'd like to find out about your current movie lineup for this Saturday. My friend and I are interested in watching a new action film. Could you tell me what's showing, what times are available in the afternoon, and how much tickets cost? Also, do you offer any couple discounts or loyalty card benefits?",
          AL: "Good evening, I'm hoping to take a few friends to the movies this Saturday and I'd like to make sure we get good seats. Could you walk me through what's currently showing? I'm particularly interested in the new releases. Additionally, could you tell me about seat availability for the evening showing, your ticket pricing — especially for groups — and whether you have any premium viewing options like recliner seats or 4D screenings?",
        },
      },
      {
        questionVariants: [
          "The movie you want to see is sold out for your preferred time. Explain the situation and ask for 2-3 alternatives.",
          "The tickets are sold out for Saturday evening. Call the theater and ask about alternatives — different times, different movies, or a different day.",
          "Your first choice of movie and time is fully booked. Ask the cinema staff for 2 or 3 other options.",
        ],
        context: 'Explain your problem and ask for realistic alternatives.',
        sampleAnswers: {
          IM: "Oh no, the 7 PM show is sold out? That's a problem. What about the 9 PM show? Or is there a different movie at 7? Or should I try on Sunday?",
          IH: "That's disappointing — we were really looking forward to that showing. Could you tell me if there are any seats left for the later showing, say 9 PM or 9:30 PM? Alternatively, is there a similar action movie showing at around the same time? Or what's the earliest available showing on Sunday?",
          AL: "That's quite unfortunate — we were specifically planning our evening around that showtime. Let me ask about my alternatives. Is there any chance of cancellations that might free up seats before Saturday? If not, what other action or thriller films do you have showing at a comparable time? And if Saturday is truly impossible, could you check availability for Sunday evening showings of the same film? I'd also appreciate knowing if there's a waitlist I could join.",
        },
      },
      {
        questionVariants: [
          "Tell me about a memorable movie-watching experience you've had. What made it special?",
          "Have you ever had a problem or an unexpected situation at a cinema? Tell me about it.",
          "Tell me about a time you went to see a movie that you remember particularly well.",
        ],
        context: 'Describe a specific, vivid movie experience with emotions and sensory details.',
        sampleAnswers: {
          IM: "I remember watching Avengers: Endgame in the cinema. The theater was completely full. When the final battle scene happened, everyone cheered. It was very exciting. I still remember how happy I felt.",
          IH: "One of my most memorable cinema experiences was watching Interstellar in IMAX a few years ago. I went with my university friends, and none of us knew much about the film beforehand. The scale of the visuals was breathtaking, and the ending caught us all completely off guard. We stayed in our seats for several minutes after the credits rolled, just processing what we'd watched. It sparked a three-hour conversation about science and the nature of time.",
          AL: "My most vivid cinema memory is watching Avengers: Endgame on opening night. I'd pre-booked tickets weeks in advance, and the atmosphere in the theater was electric. When Iron Man snapped his fingers in the climax, the entire audience erupted — people were crying, cheering, hugging strangers. It was one of those rare moments where you feel completely connected to everyone around you through a shared emotional experience. That kind of communal joy is something streaming at home simply cannot replicate, and it reminded me why the cinema, as an institution, remains irreplaceable despite all our digital alternatives.",
        },
      },
    ],
    keyExpressions: [
      { english: "What's currently showing at...?", korean: "현재 ...에서 상영 중인 영화가 무엇인가요?" },
      { english: "Are there any seats available for...?", korean: "...에 자리가 있나요?" },
      { english: "The show is sold out for...", korean: "...은(는) 매진됐습니다" },
      { english: "Could you suggest an alternative...?", korean: "다른 대안을 추천해 주시겠어요?" },
      { english: "Is there a waitlist I can join?", korean: "대기자 명단에 올릴 수 있나요?" },
    ],
  },

  /* ── 9. Coffee Shop Visit (OPIc) ── */
  {
    id: 'opic-cafe',
    title: 'Café / Coffee Shop',
    titleKo: '카페 방문',
    icon: Coffee,
    tag: 'OPIc Q11-13',
    color: 'text-amber-400',
    bgColor: 'bg-amber-500/10',
    borderColor: 'border-amber-500/20',
    description: 'Q11-13: Ask the barista about the menu → order is wrong or item is sold out → share a café memory.',
    descriptionKo: 'Q11~13: 카페 메뉴 문의 → 주문 오류/품절 해결 → 카페 경험 이야기',
    steps: [
      {
        questionVariants: [
          "Imagine you've just walked into a café. Ask the barista 3 or 4 questions about their menu and drinks.",
          "You want to try a new coffee shop. Call ahead and ask 3-4 questions about their menu, specialty drinks, and seating.",
          "You are at a coffee shop and want to find out about their new drinks. Ask the employee 3 or 4 questions.",
        ],
        context: 'Ask about their menu items, special drinks, prices, and any recommendations.',
        sampleAnswers: {
          IM: "Hello, I want to try some drinks. What is your most popular drink? Do you have any seasonal drinks? How much is a latte? Do you have non-dairy milk options?",
          IH: "Hi, I'm looking at your menu but I'd love some guidance. What's your most popular drink right now? I'm also curious about your seasonal specials — I heard you have a new autumn menu? I usually prefer oat milk, so I wanted to ask if that's available. And do your lattes come in different sizes?",
          AL: "Good morning! I'm new to this café and I'd love to start by getting some recommendations. I'm a big coffee enthusiast, so I'm curious about your house specialty and what makes it distinctive. I also noticed you have a seasonal menu — could you walk me through the new additions? I have a minor lactose intolerance, so I'd like to know which plant-based milk options you carry. And lastly, are any of your beans single-origin? I love knowing the provenance of my coffee.",
        },
      },
      {
        questionVariants: [
          "Your coffee order was completely wrong — you got the wrong drink. Talk to the staff and ask for 2-3 solutions.",
          "The item you ordered is sold out. Explain the situation to the staff and ask for 2 or 3 alternatives.",
          "You were given a hot drink when you ordered iced, and the flavor is wrong too. Address the problem with the barista.",
        ],
        context: 'Be polite but clear about the issue, and ask for specific solutions.',
        sampleAnswers: {
          IM: "Excuse me, I think there is a mistake. I ordered an iced oat latte, but this is a hot drink and it's different. Can you fix this? Can I get the right drink? Or can I have a refund?",
          IH: "Excuse me, I think there may have been a mix-up with my order. I ordered an iced oat milk latte with one shot of espresso, but what I received appears to be a regular hot latte with dairy milk. I'm lactose intolerant, so I'm actually unable to drink this. Could you either remake my original order, or if the oat milk is out, suggest something similar that would work for me?",
          AL: "I'm sorry to bother you, but I believe there's been a mix-up with my order. I specifically requested an iced oat milk flat white, but I've received what appears to be a hot dairy latte. As someone with a lactose intolerance, I'm actually unable to consume this safely. I completely understand that mistakes happen during busy hours, so I'd like to explore the best way to resolve this. Could you remake my original order? Alternatively, if you've run out of oat milk, I'd appreciate knowing what other dairy-free alternatives you carry so we can find something suitable.",
        },
      },
      {
        questionVariants: [
          "Tell me about a memorable experience you had at a café. What made it special?",
          "Have you ever had a problem or an interesting situation at a coffee shop? Tell me what happened.",
          "Tell me about a time you visited a café that you remember particularly well — perhaps because of the atmosphere, the drinks, or the people.",
        ],
        context: 'Share a vivid, specific memory from a café with sensory details and emotions.',
        sampleAnswers: {
          IM: "I remember going to a cute café in Hongdae with my friend. The interior was very beautiful with plants everywhere. We tried a signature drink that tasted like strawberries and chocolate. We stayed there for 3 hours talking and it was one of my favorite days.",
          IH: "One of my favorite café memories is discovering a tiny independent coffee shop tucked in an alley in Insadong. I stumbled upon it by accident while exploring with a friend. The owner roasted the beans on-site, and the aroma as you walked in was incredible. We ended up staying for almost three hours, completely losing track of time. It became our regular spot for the rest of that summer.",
          AL: "My most cherished café memory actually transformed how I think about the relationship between space and creativity. I was in Kyoto on a solo trip and wandered into a century-old machiya that had been converted into a specialty coffee bar. The juxtaposition of antique wooden architecture with precision brewing equipment was visually stunning, but what stayed with me was how the environment influenced my mental state. I sat there for four hours, wrote the most productive journal entry of my life, and found a kind of focused tranquility that I've been chasing ever since. It convinced me that the physical environment of a café matters just as much as the quality of the coffee.",
        },
      },
    ],
    keyExpressions: [
      { english: "What's your most popular drink right now?", korean: "지금 가장 인기 있는 음료가 뭔가요?" },
      { english: "Do you have any dairy-free options?", korean: "유제품이 없는 옵션이 있나요?" },
      { english: "I think there's been a mix-up with my order.", korean: "주문이 잘못된 것 같아요" },
      { english: "Could you remake this for me?", korean: "다시 만들어 주실 수 있나요?" },
      { english: "What would you recommend instead?", korean: "대신 무엇을 추천하시나요?" },
    ],
  },

  /* ── 10. Buying a Cell Phone (OPIc) ── */
  {
    id: 'opic-phone',
    title: 'Buying a Cell Phone',
    titleKo: '핸드폰 구매',
    icon: Smartphone,
    tag: 'OPIc Q11-13',
    color: 'text-blue-400',
    bgColor: 'bg-blue-500/10',
    borderColor: 'border-blue-500/20',
    description: 'Q11-13: Call a phone store to ask about models → model is out of stock → share a phone purchasing experience.',
    descriptionKo: 'Q11~13: 핸드폰 매장 문의 → 재고 없음 해결 → 구매 경험 이야기',
    steps: [
      {
        questionVariants: [
          "You want to buy a new cell phone. Call a phone store and ask 3-4 questions about the phones they have.",
          "You're looking to upgrade your smartphone. Visit a phone store and ask the salesperson 3 or 4 questions about the latest models.",
          "You want to buy a flagship smartphone as a birthday gift. Call an electronics store and ask 3-4 questions.",
        ],
        context: 'Ask about the latest models, features, price, and any current promotions.',
        sampleAnswers: {
          IM: "Hello, I want to buy a new phone. What are the newest models? How much does the Galaxy S24 cost? Do you have any discounts? Can I pay in installments?",
          IH: "Hi, I'm looking to upgrade my smartphone. Could you tell me about the latest flagship models you carry — specifically, how the newest Samsung compares to the iPhone in terms of camera quality and battery life? I'm also curious about your current promotions. Do you offer any trade-in deals or installment plans? And is there a trial period or return policy I should know about?",
          AL: "Good afternoon, I've been researching smartphones for the past few weeks and I'm ready to make a decision, but I have a few final questions. I'm torn between the latest Samsung Galaxy and the new iPhone, primarily because of camera capability and ecosystem integration. Could you walk me through the key differences? I'm also curious about your trade-in program — I have a two-year-old model that's still in good condition. And finally, what's your after-sales service like? I'd want to know about warranty coverage and repair turnaround times.",
        },
      },
      {
        questionVariants: [
          "The phone you want is out of stock. Call the store and explain your situation. Ask for 2-3 alternatives.",
          "Your preferred model is not available. Ask when it will be restocked or what similar models are available.",
          "The color and storage variant you want is sold out. Ask the store about alternatives or reservation options.",
        ],
        context: 'Explain why this particular phone matters to you, and ask for specific, concrete alternatives.',
        sampleAnswers: {
          IM: "Oh, the Galaxy S24 Ultra is out of stock? That's a problem. When will it come back? Can I order it? Or is there another phone that is similar?",
          IH: "That's really unfortunate — I was specifically hoping for the Galaxy S24 Ultra. Could you tell me when you expect the next shipment to arrive? Would I be able to place a pre-order or get on a waitlist? Alternatively, what comparable phones do you currently have in stock that offer similar camera specs? I'm particularly focused on the zoom capability.",
          AL: "I'm disappointed to hear that, especially since I've been planning this purchase for a while. Let me ask about my options. First, is this a temporary stock issue, and if so, when do you anticipate the next delivery? Second, could you set me up with a pre-order that guarantees me a unit from the next batch? And third, in the meantime, could you walk me through the closest alternative you currently have in terms of camera performance and processing power? I'd like to compare specifications before making a final decision.",
        },
      },
      {
        questionVariants: [
          "Tell me about a memorable experience you had when buying a phone or electronic device.",
          "Have you ever had a problem with a cell phone or electronic device? What happened and how did you solve it?",
          "Tell me about a time you were very excited about getting a new phone or gadget.",
        ],
        context: 'Share a specific, relatable story about a phone or gadget experience.',
        sampleAnswers: {
          IM: "I remember when I bought my first smartphone. I saved money for three months to buy it. When I finally got it, I was so happy. I stayed up all night setting it up and downloading apps. It was one of the best feelings I had as a student.",
          IH: "A few years ago, I had a really frustrating experience with a brand-new phone. Within a week of buying it, the battery started draining unusually fast. I brought it back to the store, but they initially said it was normal behavior. I had to be quite persistent — I documented the battery drain with screenshots and eventually escalated to a store manager. After two weeks, I finally got a replacement unit, which has worked perfectly ever since. It taught me a lot about consumer rights.",
          AL: "My most memorable phone purchase experience was actually when I queued overnight for the iPhone X back in 2017. Looking back, it seems almost absurd — spending the night on a pavement outside a store for a consumer product — but at the time, there was this palpable sense of shared excitement among the thirty or so people in the queue. We swapped phone stories, ordered food delivery together, and by morning had formed a peculiar sense of camaraderie. When I finally got the device in my hands and walked out into the sunrise, I remember feeling a complicated mix of childlike excitement and slight embarrassment. I haven't queued for a phone since, but I still think about that night fondly as a uniquely human and slightly absurd moment.",
        },
      },
    ],
    keyExpressions: [
      { english: "I'm looking to upgrade my phone to...", korean: "...으로 핸드폰을 업그레이드하려고 합니다" },
      { english: "Do you offer a trade-in program?", korean: "기기 보상 프로그램이 있나요?" },
      { english: "Is this model currently in stock?", korean: "이 모델이 현재 재고가 있나요?" },
      { english: "Could I be put on a waitlist?", korean: "대기자 명단에 올려주실 수 있나요?" },
      { english: "What's the closest alternative you have?", korean: "가장 비슷한 대체 상품은 무엇인가요?" },
    ],
  },

  /* ── 11. Buying Appliances (OPIc) ── */
  {
    id: 'opic-appliance',
    title: 'Buying Appliances',
    titleKo: '가전제품 구매',
    icon: ShoppingCart,
    tag: 'OPIc Q11-13',
    color: 'text-violet-400',
    bgColor: 'bg-violet-500/10',
    borderColor: 'border-violet-500/20',
    description: 'Q11-13: Visit an appliance store → the appliance breaks after purchase → share a past shopping experience.',
    descriptionKo: 'Q11~13: 가전제품 매장 문의 → 구매 후 고장 해결 → 쇼핑 경험 이야기',
    steps: [
      {
        questionVariants: [
          "Imagine you went to an appliance store to buy a washing machine. Ask the salesperson 3 or 4 questions.",
          "You want to buy a new refrigerator for your apartment. Visit an appliance store and ask the salesperson 3-4 questions.",
          "You are at an electronics store looking for a new air conditioner. Ask 3-4 questions about the models available.",
        ],
        context: 'Ask about features, energy efficiency, warranty, price, and delivery.',
        sampleAnswers: {
          IM: "Hello, I want to buy a washing machine. What is the best model? How much does it cost? Is there a warranty? Can you deliver it to my apartment?",
          IH: "Hi, I'm looking for a front-loading washing machine for my new apartment. Could you recommend a good model that's energy-efficient? I'm also wondering about the warranty period and what it covers. Would delivery and installation be included in the price? And do you currently have any promotional discounts or bundle deals?",
          AL: "Good afternoon, I'm in the market for a washing machine and I've been doing some research, but I'd appreciate your expert input. I'm specifically looking for a front-loader with strong energy efficiency ratings and a quiet motor — I live in an apartment building, so noise is a real concern. Could you walk me through your top two or three recommendations and explain what sets them apart? I'm also curious about the extended warranty options beyond the standard coverage, and whether delivery and installation services are available and what those costs look like.",
        },
      },
      {
        questionVariants: [
          "The washing machine you bought stopped working after just one week. Call the store and ask for 2-3 solutions.",
          "The refrigerator you purchased is making a strange noise and not cooling properly after two weeks. Call and explain the issue.",
          "Your new air conditioner broke down the first time you used it. Call the store and describe the problem. Ask for solutions.",
        ],
        context: 'Clearly describe the malfunction, when it started, and what solutions you expect.',
        sampleAnswers: {
          IM: "Hello, I bought a washing machine from your store last week, and now it doesn't work. It makes a loud noise and then stops. I need help. Can you fix it or give me a new one?",
          IH: "Hi, I purchased a washing machine from your store exactly one week ago, and unfortunately it's already malfunctioning. When I run a cycle, it makes a grinding noise halfway through and then stops completely. I have the receipt here. I'd like to know what my options are — can a technician come to diagnose and repair it? And if it can't be repaired quickly, am I eligible for a replacement under your warranty policy?",
          AL: "Good morning, I'm contacting you about a serious malfunction with a washing machine I purchased from your store one week ago. When I run any cycle, the drum makes a loud grinding noise approximately midway through and then shuts down completely with an error code. I've consulted the manual and tried all the suggested troubleshooting steps without success. I have my receipt and warranty documentation. What I'd like to explore are my options under your warranty — specifically, can you arrange for a technician to come inspect it today or tomorrow? And if the machine is deemed defective, what is your policy on providing a replacement unit?",
        },
      },
      {
        questionVariants: [
          "Tell me about a memorable experience you had when buying a major appliance or electronic device.",
          "Have you ever had a problem with an appliance you purchased? Tell me what happened and how it was resolved.",
          "Tell me about a time when shopping for something for your home was particularly difficult or memorable.",
        ],
        context: 'Share a detailed story about an appliance or home shopping experience.',
        sampleAnswers: {
          IM: "I remember when my mother and I went to buy a refrigerator. We spent the whole Saturday going to different stores comparing prices. We finally found a good one on sale. It was very tiring but we were happy. That refrigerator is still working at home.",
          IH: "A few years ago, I moved into my first apartment and needed to furnish it from scratch. Buying the washing machine was actually one of the most stressful parts. I did extensive research online for two weeks, narrowed it down to three models, and then visited three different stores to compare them in person. What I didn't anticipate was how dramatically the prices varied between stores for the same model. I ended up negotiating a 15% discount by showing the competing store's price on my phone. It was my first real experience with negotiation, and I was surprised by how effective it was.",
          AL: "My most memorable appliance-buying experience was helping my parents replace their ancient washing machine — a task that turned into an unexpectedly profound generational conversation. What began as a simple errand evolved into a three-hour discussion about value, quality versus price, and my parents' philosophy of ownership. They had owned their previous machine for 22 years and considered that longevity the hallmark of a worthwhile purchase. I, on the other hand, was focused on the latest smart features and connectivity. We ended up choosing a mid-range model that satisfied both criteria — built to last, but with the modern efficiency ratings that matter for energy costs. More than the purchase itself, I remember that afternoon as one of the most genuine conversations I've had with my parents about values and how different generations think about consumption.",
        },
      },
    ],
    keyExpressions: [
      { english: "Could you walk me through your top recommendations?", korean: "주요 추천 제품을 설명해 주시겠어요?" },
      { english: "What does the warranty cover?", korean: "보증이 어떤 부분을 커버하나요?" },
      { english: "The appliance is malfunctioning...", korean: "가전제품에 오작동이 있습니다" },
      { english: "I'd like to request a technician visit.", korean: "기술자 방문을 요청하고 싶습니다" },
      { english: "Am I eligible for a replacement?", korean: "교품 자격이 있나요?" },
    ],
  },

  /* ── 12. Concert/Performance Tickets (OPIc) ── */
  {
    id: 'opic-concert',
    title: 'Concert / Performance',
    titleKo: '공연 티켓 구매',
    icon: Ticket,
    tag: 'OPIc Q11-13',
    color: 'text-rose-400',
    bgColor: 'bg-rose-500/10',
    borderColor: 'border-rose-500/20',
    description: 'Q11-13: Call the box office to ask about tickets → tickets are sold out → share a past concert experience.',
    descriptionKo: 'Q11~13: 공연 티켓 문의 → 매진 해결 → 공연 관람 경험 이야기',
    steps: [
      {
        questionVariants: [
          "You want to see a live concert this weekend. Call the box office and ask 3-4 questions about the tickets and performance.",
          "You'd like to buy tickets for a musical performance. Call the ticket office and ask 3 or 4 questions about availability and seating.",
          "You are interested in attending a classical music concert. Call the venue and ask 3-4 questions about the upcoming performance.",
        ],
        context: 'Ask about the performance schedule, ticket prices, seating options, and any discounts.',
        sampleAnswers: {
          IM: "Hello, I want to buy tickets for the concert. When is it? How much are the tickets? Are there still seats available? Is there a student discount?",
          IH: "Hi, I'd like to find out more about the upcoming concert this Saturday. Could you tell me what types of seating are available and the price difference between them? I'm also wondering whether there are any group or early-bird discounts. And one more question — what time do the doors open, and is there a support act before the main performance?",
          AL: "Good afternoon, I'm interested in attending the concert this Saturday and I have a few questions before I commit to purchasing. Could you walk me through the seating categories and the view from each section? I'd also like to know about any package deals — for instance, whether you offer VIP packages that include meet-and-greet opportunities or priority entry. What's your policy on ticket exchanges if something comes up? And finally, are there any age restrictions for the venue?",
        },
      },
      {
        questionVariants: [
          "The tickets for the performance are completely sold out. Explain the situation and ask for 2-3 alternatives.",
          "Your preferred seating section is sold out. Ask about other seating options or upcoming performances.",
          "The concert you wanted to attend is sold out. Ask if there will be another performance or other options.",
        ],
        context: 'Express your disappointment and ask for concrete alternatives.',
        sampleAnswers: {
          IM: "The concert is sold out? That's really disappointing. Is there another performance next weekend? Or is there a waitlist? Or can you recommend a similar concert that is not sold out?",
          IH: "Oh, that's really disappointing — I was looking forward to this for weeks. Could you tell me if there are any additional performances scheduled, perhaps the following weekend? If not, is there a cancellation waitlist I could join? And as a last resort, could you recommend any other performances of a similar style happening in the next two weeks?",
          AL: "That's quite disappointing news — I've had this date circled on my calendar for a while. Let me ask about what options remain. First, is there any possibility of additional dates being added, given that this one has sold out so quickly? Second, do you maintain a cancellation list, and if so, how does that typically work — do people tend to return tickets close to the performance date? Third, are there other performances of comparable quality at your venue in the next month? I'm genuinely interested in supporting live music, so I'd rather find an alternative than abandon the idea entirely.",
        },
      },
      {
        questionVariants: [
          "Tell me about a memorable concert or live performance you've attended. What made it special?",
          "Have you ever had a problem or an unexpected situation at a concert or performance? Tell me about it.",
          "Tell me about the best or most memorable live performance experience you've had.",
        ],
        context: 'Paint a vivid picture of a concert experience — the venue, music, crowd energy, and your emotions.',
        sampleAnswers: {
          IM: "I went to a K-pop concert last year. The stadium was full of fans wearing light sticks. When the artists came on stage, everyone screamed. The light sticks made the whole stadium look like stars. I cried because I was so happy. It was unforgettable.",
          IH: "The most memorable concert I've been to was a Coldplay show two years ago. What set it apart from any other concert was the LED wristbands — when you entered, you were given this bracelet that automatically synchronized with the show's lighting design. When Chris Martin walked out and the opening notes started playing, the entire stadium erupted in color. It felt like being part of one giant living organism rather than just an audience member.",
          AL: "My most transcendent concert experience was seeing a jazz quartet perform in a tiny underground club in New York during a work trip. It was a completely spontaneous decision — I'd wandered past the venue, heard the music drifting up from below, and bought a ticket on the spot for twelve dollars. The space held maybe eighty people, and the musicians were performing the kind of music where you could hear every breath, every subtle shift in rhythm. After two hours, I emerged back into the Manhattan night feeling strangely transformed — as though I'd been let in on a conversation about something profound that had no words. It gave me a deep appreciation for the difference between music as entertainment and music as a genuinely transcendent form of communication.",
        },
      },
    ],
    keyExpressions: [
      { english: "I'd like to purchase tickets for...", korean: "...의 티켓을 구매하고 싶습니다" },
      { english: "What seating options are available?", korean: "어떤 좌석 옵션이 있나요?" },
      { english: "Is there a cancellation waitlist?", korean: "취소 대기자 명단이 있나요?" },
      { english: "Are there any additional performances scheduled?", korean: "추가 공연이 예정되어 있나요?" },
      { english: "The atmosphere was absolutely electric.", korean: "분위기가 정말 열광적이었어요." },
    ],
  },
];

/* ═══════════════════════════════════════════════════════════════════
   COMPONENT
═══════════════════════════════════════════════════════════════════ */
export default function RoleplayPage() {
  const [selectedScenarioId, setSelectedScenarioId] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [sampleLevel, setSampleLevel] = useState<AnswerLevel>('IH');
  const [showSample, setShowSample] = useState(false);
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());
  const [activeVariants, setActiveVariants] = useState<number[]>([]);
  const [waveformBars, setWaveformBars] = useState<number[]>(Array(20).fill(4));
  const [recordingTime, setRecordingTime] = useState(0);
  const [speakingId, setSpeakingId] = useState<string | null>(null);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const waveRef = useRef<ReturnType<typeof setInterval> | null>(null);

  /* ── Speech hooks ── */
  const { speak, stop: stopTTS, isSpeaking } = useTTS();
  const { isListening, isSupported: sttSupported, toggleListening } =
    useSpeechRecognition(() => {});

  /* ── Clear speakingId when TTS finishes ── */
  useEffect(() => { if (!isSpeaking) setSpeakingId(null); }, [isSpeaking]);

  const selectedScenario = scenarios.find((s) => s.id === selectedScenarioId);

  /* ── Recording controls ── */
  const startRecording = () => {
    setRecordingTime(0);
    setShowSample(false);
    timerRef.current = setInterval(() => setRecordingTime((t) => t + 1), 1000);
    waveRef.current = setInterval(() => {
      setWaveformBars(Array(20).fill(0).map(() => Math.random() * 28 + 4));
    }, 100);
  };

  const stopRecording = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (waveRef.current) clearInterval(waveRef.current);
    setWaveformBars(Array(20).fill(4));
    setCompletedSteps((prev) => new Set(prev).add(currentStep));
  }, [currentStep]);

  const formatTime = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`;

  /* ── Open scenario with randomized question variants ── */
  const openScenario = (id: string) => {
    const scenario = scenarios.find((s) => s.id === id);
    if (!scenario) return;
    const variants = scenario.steps.map((step) =>
      Math.floor(Math.random() * step.questionVariants.length)
    );
    setSelectedScenarioId(id);
    setActiveVariants(variants);
    setCurrentStep(0);
    setCompletedSteps(new Set());
    setShowSample(false);
    stopTTS();
  };

  /* ── Randomize question for current step ── */
  const reshuffleStep = () => {
    if (!selectedScenario) return;
    const step = selectedScenario.steps[currentStep];
    const newVariant = Math.floor(Math.random() * step.questionVariants.length);
    setActiveVariants((prev) => {
      const next = [...prev];
      next[currentStep] = newVariant;
      return next;
    });
    setShowSample(false);
  };

  /* ── Speak sample answer ── */
  const handleSpeak = (text: string, id: string) => {
    if (speakingId === id) {
      stopTTS();
      setSpeakingId(null);
    } else {
      speak(text, 0.88);
      setSpeakingId(id);
    }
  };

  /* ═══════════════════════════════════════════════════════════════════
     VIEW: Scenario List
  ═══════════════════════════════════════════════════════════════════ */
  if (!selectedScenario) {
    const opicScenarios = scenarios.filter((s) => s.tag);
    const practiceScenarios = scenarios.filter((s) => !s.tag);

    return (
      <div className="min-h-screen bg-[var(--bg-primary)]">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
          {/* Header */}
          <div className="mb-8">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-500/10 text-indigo-400 text-sm font-medium mb-4">
              <MessageSquare className="w-4 h-4" />
              OPIc Roleplay
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold text-[var(--text-primary)] mb-2">
              OPIc Roleplay
            </h1>
            <p className="text-[var(--text-secondary)] text-lg">
              매번 새로운 질문으로 연습하세요 — 열 때마다 랜덤으로 바뀝니다
            </p>
          </div>

          {/* Info box */}
          <div className="bg-indigo-500/10 rounded-2xl border border-indigo-500/20 p-6 mb-8">
            <div className="flex items-start gap-3">
              <HelpCircle className="w-5 h-5 text-indigo-400 mt-0.5 shrink-0" />
              <div>
                <h3 className="font-semibold text-indigo-300 mb-2">OPIc Roleplay 구성</h3>
                <p className="text-sm text-indigo-200/70 leading-relaxed">
                  OPIc 시험에서 롤플레이 문제는 Q11(정보수집) → Q12(문제해결) → Q13(과거경험) 3단계로 구성됩니다.
                  버튼을 누를 때마다 질문이 랜덤으로 바뀌어 같은 주제에서도 다양하게 연습할 수 있습니다.
                  🎲 버튼으로 현재 질문만 다시 뽑을 수도 있습니다.
                </p>
              </div>
            </div>
          </div>

          {/* OPIc Q11-13 Scenarios */}
          <div className="mb-10">
            <h2 className="text-base font-semibold text-[var(--text-primary)] mb-4 flex items-center gap-2">
              <Star className="w-4 h-4 text-amber-400" />
              OPIc 실전 시나리오 (Q11-Q13)
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {opicScenarios.map((scenario) => {
                const Icon = scenario.icon;
                return (
                  <button
                    key={scenario.id}
                    onClick={() => openScenario(scenario.id)}
                    className={`${scenario.bgColor} rounded-2xl border ${scenario.borderColor} p-6 text-left hover:scale-[1.02] transition-all group`}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
                        <Icon className={`w-5 h-5 ${scenario.color}`} />
                      </div>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30">
                        {scenario.tag}
                      </span>
                    </div>
                    <h3 className="text-base font-semibold text-[var(--text-primary)] mb-0.5 group-hover:text-white transition-colors">
                      {scenario.title}
                    </h3>
                    <p className="text-xs text-[var(--text-muted)] mb-3">{scenario.titleKo}</p>
                    <p className="text-xs text-[var(--text-secondary)] leading-relaxed mb-4">
                      {scenario.descriptionKo}
                    </p>
                    <div className="flex items-center gap-1 text-xs font-medium" style={{ color: scenario.color.replace('text-', '').replace('-400', '') }}>
                      <Shuffle className="w-3 h-3" />
                      랜덤 질문 · 3단계
                      <ArrowRight className="w-3 h-3 ml-auto group-hover:translate-x-1 transition-transform" />
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Practice Scenarios */}
          <div>
            <h2 className="text-base font-semibold text-[var(--text-primary)] mb-4 flex items-center gap-2">
              <MessageCircle className="w-4 h-4 text-indigo-400" />
              일반 롤플레이 연습
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {practiceScenarios.map((scenario) => {
                const Icon = scenario.icon;
                return (
                  <button
                    key={scenario.id}
                    onClick={() => openScenario(scenario.id)}
                    className={`${scenario.bgColor} rounded-2xl border ${scenario.borderColor} p-6 text-left hover:scale-[1.02] transition-all group`}
                  >
                    <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center mb-3">
                      <Icon className={`w-5 h-5 ${scenario.color}`} />
                    </div>
                    <h3 className="text-base font-semibold text-[var(--text-primary)] mb-0.5 group-hover:text-white transition-colors">
                      {scenario.title}
                    </h3>
                    <p className="text-xs text-[var(--text-muted)] mb-3">{scenario.titleKo}</p>
                    <p className="text-xs text-[var(--text-secondary)] leading-relaxed mb-4">
                      {scenario.description}
                    </p>
                    <div className="flex items-center gap-1 text-xs text-indigo-400 font-medium">
                      <MessageCircle className="w-3.5 h-3.5" />
                      3-step scenario
                      <ArrowRight className="w-3 h-3 ml-auto group-hover:translate-x-1 transition-transform" />
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    );
  }

  /* ═══════════════════════════════════════════════════════════════════
     VIEW: Scenario Practice
  ═══════════════════════════════════════════════════════════════════ */
  const step = selectedScenario.steps[currentStep];
  const question = step.questionVariants[activeVariants[currentStep] ?? 0] || step.questionVariants[0];
  const Icon = selectedScenario.icon;
  const sampleAnswerId = `answer-${currentStep}-${sampleLevel}`;

  return (
    <div className="min-h-screen bg-[var(--bg-primary)]">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
        {/* Back */}
        <button
          onClick={() => { setSelectedScenarioId(null); stopTTS(); }}
          className="flex items-center gap-1 text-sm text-[var(--text-secondary)] hover:text-indigo-400 transition-colors mb-6"
        >
          <ChevronLeft className="w-4 h-4" />
          Back to scenarios
        </button>

        {/* Scenario Header */}
        <div className={`${selectedScenario.bgColor} rounded-2xl border ${selectedScenario.borderColor} p-6 mb-6`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
                <Icon className={`w-5 h-5 ${selectedScenario.color}`} />
              </div>
              <div>
                <h1 className="text-xl font-bold text-[var(--text-primary)]">{selectedScenario.title}</h1>
                <p className="text-sm text-[var(--text-muted)]">{selectedScenario.titleKo}</p>
              </div>
            </div>
            {selectedScenario.tag && (
              <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30">
                {selectedScenario.tag}
              </span>
            )}
          </div>
        </div>

        {/* Step Progress */}
        <div className="flex items-center gap-2 mb-6">
          {selectedScenario.steps.map((_, i) => (
            <div key={i} className="flex items-center gap-2 flex-1">
              <button
                onClick={() => { setCurrentStep(i); setShowSample(false); stopTTS(); }}
                className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold transition-all ${
                  i === currentStep
                    ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-sm'
                    : completedSteps.has(i)
                    ? 'bg-emerald-500/20 text-emerald-400'
                    : 'bg-[var(--bg-secondary)] text-[var(--text-muted)]'
                }`}
              >
                {completedSteps.has(i) && i !== currentStep ? <CheckCircle2 className="w-4 h-4" /> : i + 1}
              </button>
              {i < selectedScenario.steps.length - 1 && (
                <div className={`flex-1 h-0.5 rounded ${completedSteps.has(i) ? 'bg-emerald-400/50' : 'bg-[var(--border-color)]'}`} />
              )}
            </div>
          ))}
        </div>

        {/* Question Card */}
        <div className="bg-[var(--bg-card)] rounded-2xl border border-[var(--border-color)] p-6 sm:p-8 mb-6 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs text-[var(--text-muted)] uppercase tracking-wider">
              Step {currentStep + 1} of {selectedScenario.steps.length}
              {currentStep === 0 && selectedScenario.tag && <span className="ml-2 text-amber-400">· Q11 정보수집</span>}
              {currentStep === 1 && selectedScenario.tag && <span className="ml-2 text-orange-400">· Q12 문제해결</span>}
              {currentStep === 2 && selectedScenario.tag && <span className="ml-2 text-emerald-400">· Q13 과거경험</span>}
            </p>
            {/* Reshuffle button */}
            <button
              onClick={reshuffleStep}
              title="Get a different random question"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[var(--border-color)] text-xs text-[var(--text-muted)] hover:border-indigo-500/40 hover:text-indigo-400 transition-all"
            >
              <Shuffle size={12} />
              다른 질문
            </button>
          </div>
          <p className="text-lg font-semibold text-[var(--text-primary)] leading-relaxed mb-3">
            {question}
          </p>
          <p className="text-sm text-[var(--text-muted)] italic">{step.context}</p>
        </div>

        {/* Recording / STT Area */}
        <div className="bg-[var(--bg-card)] rounded-2xl border border-[var(--border-color)] p-6 sm:p-8 mb-6 shadow-sm">
          <div className="flex flex-col items-center py-4">
            {sttSupported ? (
              <>
                <div className="relative inline-flex items-center justify-center mb-4">
                  {isListening && (
                    <div className="absolute w-20 h-20 rounded-full bg-red-500/20 animate-ping" />
                  )}
                  <button
                    onClick={() => {
                      if (isListening) {
                        toggleListening();
                        stopRecording();
                      } else {
                        toggleListening();
                        startRecording();
                      }
                    }}
                    className={`relative z-10 w-16 h-16 rounded-full flex items-center justify-center transition-all shadow-lg ${
                      isListening
                        ? 'bg-red-500 hover:bg-red-600 text-white'
                        : 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white hover:opacity-90'
                    }`}
                  >
                    {isListening ? <MicOff className="w-6 h-6" /> : <Mic className="w-7 h-7" />}
                  </button>
                </div>
                {isListening && (
                  <>
                    <p className="text-xl font-mono font-bold text-[var(--text-primary)] mb-2">
                      {formatTime(recordingTime)}
                    </p>
                    <div className="flex items-center justify-center gap-[2px] h-8 mb-2">
                      {waveformBars.map((h, i) => (
                        <div
                          key={i}
                          className="w-1 rounded-full bg-indigo-400 transition-all duration-100"
                          style={{ height: `${h}px` }}
                        />
                      ))}
                    </div>
                  </>
                )}
                <p className="text-xs text-[var(--text-muted)]">
                  {isListening ? '🎤 말하고 있습니다… 탭하여 중지' : completedSteps.has(currentStep) ? '✅ 완료! 다시 연습하려면 탭하세요' : '마이크 버튼을 눌러 답변하세요'}
                </p>
              </>
            ) : (
              <p className="text-sm text-[var(--text-muted)]">마이크 연습은 Chrome에서 지원됩니다</p>
            )}
          </div>
        </div>

        {/* Sample Answer */}
        <div className="bg-[var(--bg-card)] rounded-2xl border border-[var(--border-color)] overflow-hidden mb-6">
          <button
            onClick={() => setShowSample(!showSample)}
            className="w-full flex items-center justify-between px-6 py-4 hover:bg-[var(--bg-secondary)] transition-colors"
          >
            <span className="flex items-center gap-2 text-sm font-medium text-[var(--text-secondary)]">
              <Volume2 className="w-4 h-4 text-indigo-400" />
              샘플 답변 보기 (IM / IH / AL)
            </span>
            {showSample ? <ChevronUp className="w-4 h-4 text-[var(--text-muted)]" /> : <ChevronDown className="w-4 h-4 text-[var(--text-muted)]" />}
          </button>
          {showSample && (
            <div className="px-6 pb-5 border-t border-[var(--border-color)]">
              <div className="flex gap-1 mt-4 mb-3">
                {(['IM', 'IH', 'AL'] as AnswerLevel[]).map((level) => (
                  <button
                    key={level}
                    onClick={() => setSampleLevel(level)}
                    className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                      sampleLevel === level
                        ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white'
                        : 'bg-[var(--bg-secondary)] text-[var(--text-muted)] hover:text-[var(--text-secondary)]'
                    }`}
                  >
                    {level}
                  </button>
                ))}
              </div>
              <div className="flex items-start justify-between gap-3">
                <p className="text-sm text-[var(--text-secondary)] leading-relaxed flex-1">
                  {step.sampleAnswers[sampleLevel]}
                </p>
                <button
                  onClick={() => handleSpeak(step.sampleAnswers[sampleLevel], sampleAnswerId)}
                  className={`shrink-0 p-2 rounded-lg transition-all ${
                    speakingId === sampleAnswerId
                      ? 'bg-violet-500/20 text-violet-400'
                      : 'text-[var(--text-muted)] hover:text-indigo-400 hover:bg-indigo-500/10'
                  }`}
                >
                  {speakingId === sampleAnswerId ? <VolumeX size={16} /> : <Volume2 size={16} />}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Key Expressions */}
        <div className="bg-[var(--bg-card)] rounded-2xl border border-[var(--border-color)] p-5 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <Star className="w-4 h-4 text-amber-400" />
            <h3 className="text-sm font-semibold text-[var(--text-primary)]">Key Expressions</h3>
          </div>
          <div className="space-y-2">
            {selectedScenario.keyExpressions.map((expr, i) => (
              <div key={i} className="flex items-start gap-3 py-2 border-b border-[var(--border-color)] last:border-0">
                <p className="flex-1 text-sm font-medium text-indigo-400">{expr.english}</p>
                <p className="flex-1 text-sm text-[var(--text-muted)]">{expr.korean}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => { setCurrentStep((s) => s - 1); setShowSample(false); stopTTS(); }}
            disabled={currentStep === 0}
            className="flex items-center gap-1 px-4 py-2 rounded-xl border border-[var(--border-color)] text-sm font-medium text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <ChevronLeft className="w-4 h-4" />
            Previous
          </button>
          <button
            onClick={() => {
              if (currentStep < selectedScenario.steps.length - 1) {
                setCurrentStep((s) => s + 1);
                setShowSample(false);
                stopTTS();
              } else {
                setSelectedScenarioId(null);
                stopTTS();
              }
            }}
            className="flex items-center gap-1 px-5 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 text-white text-sm font-medium hover:opacity-90 transition-all"
          >
            {currentStep < selectedScenario.steps.length - 1 ? 'Next Step' : 'Back to Scenarios'}
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
