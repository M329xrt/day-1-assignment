# Day 8 Reflection

The most difficult concept in this course was understanding how to
design a system that stays correct when many users act at the same time.
It was easy to think that checking whether a seat was available on the
screen would be enough. I learned that two people can see the same seat
as available and try to buy it together. I overcame this by breaking the
process into steps: use a database transaction, lock or conditionally
update the seat, and add a database constraint so the same seat cannot
be confirmed twice. Working through the popular-concert example also
helped me understand why performance and correctness must be designed
together.

Based on the feedback I received on my capstone, I would improve the
user experience and make the design decisions easier to understand. I
would make important status changes clearer, explain what happens when a
request fails, and test the main user journeys with realistic data. I
would also document trade-offs instead of presenting the chosen solution
as if it had no disadvantages. This would help me explain why the system
is designed that way and what could be improved later.

Next, I want to learn more about automated testing and load testing. I
would like to test what happens when many users request the same seat,
when payment notifications arrive more than once, and when a service
becomes temporarily unavailable. I also want to practise monitoring
application performance so I can identify bottlenecks before users
experience them.
