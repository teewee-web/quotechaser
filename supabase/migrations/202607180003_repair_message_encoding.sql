update public.user_settings
set follow_up_message = replace(follow_up_message, convert_from(decode('c3a2e282ace284a2','hex'),'UTF8'), ''''),
    review_request_message = replace(review_request_message, convert_from(decode('c3a2e282ace284a2','hex'),'UTF8'), '''')
where position(decode('c3a2','hex') in convert_to(follow_up_message,'UTF8')) > 0
   or position(decode('c3a2','hex') in convert_to(review_request_message,'UTF8')) > 0;

alter table public.user_settings
  alter column follow_up_message set default 'Hi [customer name], I hope you''re well. I''m following up regarding the quotation for [job description]. Please let me know if you have any questions or would like to arrange a suitable start date. Kind regards.',
  alter column review_request_message set default 'Hi [customer name], thank you for choosing us for your recent work. We''d really appreciate it if you could leave a short Google review about your experience: [review link]';
