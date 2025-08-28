--
-- PostgreSQL database dump
--

-- Dumped from database version 17.4
-- Dumped by pg_dump version 17.4 (Homebrew)

SET statement_timeout = 0;
SET lock_timeout = 0;
-- SET idle_in_transaction_session_timeout = 0;
-- SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: pgcrypto; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA public;


--
-- Name: EXTENSION pgcrypto; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON EXTENSION pgcrypto IS 'cryptographic functions';


--
-- Name: set_updated_at(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.set_updated_at() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;


--
-- Name: update_modified_column(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_modified_column() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;


--
-- Name: update_timestamp(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_timestamp() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    NEW.last_updated = NOW();
    RETURN NEW;
END;
$$;


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: events; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.events (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    title character varying(255) NOT NULL,
    description text,
    start_time timestamp with time zone NOT NULL,
    end_time timestamp with time zone NOT NULL,
    location character varying(255),
    color character varying(50) DEFAULT 'default'::character varying NOT NULL,
    created_by uuid NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: project_bookmarks; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.project_bookmarks (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    project_id uuid NOT NULL,
    saved_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: projects; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.projects (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    title character varying(255) NOT NULL,
    description text NOT NULL,
    owner_id uuid NOT NULL,
    is_idea boolean DEFAULT false NOT NULL,
    recruitment_status character varying(100) NOT NULL,
    industry text[] DEFAULT '{}'::text[] NOT NULL,
    required_skills text[] DEFAULT '{}'::text[] NOT NULL,
    location_type character varying(50) NOT NULL,
    estimated_start date,
    estimated_end date,
    contact_info jsonb DEFAULT '{}'::jsonb NOT NULL,
    views integer DEFAULT 0 NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    last_updated timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    project_status character varying(50) NOT NULL,
    deleted boolean DEFAULT false NOT NULL,
    updated_at timestamp without time zone DEFAULT now()
);


--
-- Name: user_bookmarks; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_bookmarks (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    bookmarked_user_id uuid NOT NULL,
    saved_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: users; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.users (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    full_name character varying(255) NOT NULL,
    email character varying(255) NOT NULL,
    bio text,
    industry text[] DEFAULT '{}'::text[] NOT NULL,
    skills text[] DEFAULT '{}'::text[] NOT NULL,
    linkedin_url character varying(255),
    website_url character varying(255),
    resume_url character varying(255),
    additional_links jsonb DEFAULT '[]'::jsonb,
    contact jsonb DEFAULT '{}'::jsonb NOT NULL,
    views integer DEFAULT 0 NOT NULL,
    graduation_year integer,
    is_texas_am_affiliate boolean DEFAULT false NOT NULL,
    avatar character varying(255),
    password_hash character varying(255),
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    refresh_token character varying(255),
    email_verified boolean DEFAULT false,
    deleted boolean DEFAULT false NOT NULL
);


--
-- Data for Name: events; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.events VALUES ('f9d1c419-358c-4e20-b220-c9461efdf1d0', 'Innovation Workshop - Updated', 'Hands-on workshop about design thinking and rapid prototyping with experienced mentors', '2025-04-15 14:00:00+00', '2025-04-15 17:00:00+00', 'Zach Building, Room 305', 'blue', '190d1ee3-45ab-41e5-b872-617e2ad47ec8', '2025-03-26 21:14:34.865043+00', '2025-03-26 21:16:24.637953+00');


--
-- Data for Name: project_bookmarks; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.project_bookmarks VALUES ('c9fefedf-1014-43c7-9375-2615fa353ccf', 'c46ddab3-a647-479c-865b-c29216f07802', 'e79c0106-5415-4b7e-83d7-032623f66e2f', '2025-02-16 11:20:00+00');
INSERT INTO public.project_bookmarks VALUES ('ba996204-1bb0-4279-97d4-fcbf6949feaa', 'c46ddab3-a647-479c-865b-c29216f07802', 'e4de4635-0ef7-4186-8399-dcb2a35aef83', '2025-02-19 15:30:00+00');
INSERT INTO public.project_bookmarks VALUES ('91a5003e-4f4e-4166-9bf2-b2ad38618eeb', '3eb8b77f-5f14-45a3-922e-f5b1f41f6395', '3b075cce-10a3-4ca9-87a6-852b9c26f6ad', '2025-02-21 10:45:00+00');
INSERT INTO public.project_bookmarks VALUES ('a89b9e85-ccb3-482c-aac9-6c10fe365fdd', 'd69452b3-29e9-4661-8ebc-e57dcb3f0ab7', '3e4ed4fb-8fb2-4d19-8310-160bbce86cc3', '2025-02-22 13:10:00+00');


--
-- Data for Name: projects; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.projects VALUES ('3b075cce-10a3-4ca9-87a6-852b9c26f6ad', 'AI-Powered Learning Platform', 'Building an adaptive learning platform that uses AI to personalize educational content for students based on their learning style and progress.', 'c46ddab3-a647-479c-865b-c29216f07802', false, 'Recruiting team members', '{Education,"Artificial Intelligence"}', '{"Machine Learning",React,Node.js,Python}', 'Remote', '2025-03-15', '2025-09-15', '{"email": "john@example.com", "phone": "123-456-7890"}', 250, '2025-02-10 12:00:00+00', '2025-02-20 15:30:00+00', 'Not Started', false, '2025-03-27 19:00:11.123823');
INSERT INTO public.projects VALUES ('3e4ed4fb-8fb2-4d19-8310-160bbce86cc3', 'Sustainable Fashion Marketplace', 'Creating a marketplace that connects eco-conscious consumers with sustainable fashion brands and second-hand clothing sellers.', '3eb8b77f-5f14-45a3-922e-f5b1f41f6395', true, 'Looking for co-founders', '{Fashion,E-commerce,Sustainability}', '{"UI/UX Design",React,Node.js,Marketing}', 'Hybrid', '2025-04-01', '2025-10-31', '{"email": "jane@example.com", "phone": "234-567-8901"}', 180, '2025-02-15 09:45:00+00', '2025-02-22 11:20:00+00', 'Idea Phase', false, '2025-03-27 19:00:11.123823');
INSERT INTO public.projects VALUES ('e79c0106-5415-4b7e-83d7-032623f66e2f', 'Smart Home Energy Management System', 'Developing a system that optimizes energy usage in homes by learning from user behavior and integrating with smart home devices.', 'd69452b3-29e9-4661-8ebc-e57dcb3f0ab7', false, 'Full team, seeking investment', '{IoT,Energy,"Smart Home"}', '{"IoT Development","Machine Learning","Mobile Development","Hardware Design"}', 'In-person', '2025-03-01', '2026-03-01', '{"email": "robert@example.com", "phone": "345-678-9012"}', 320, '2025-02-05 14:30:00+00', '2025-02-25 16:45:00+00', 'Ongoing', false, '2025-03-27 19:00:11.123823');
INSERT INTO public.projects VALUES ('e4de4635-0ef7-4186-8399-dcb2a35aef83', 'Community-Based Mental Health App', 'Creating a mobile application that connects individuals with mental health resources and community support groups in their area.', '190d1ee3-45ab-41e5-b872-617e2ad47ec8', false, 'Recruiting team members', '{Healthcare,"Mental Health","Mobile Apps"}', '{"React Native",Firebase,"UI/UX Design","Healthcare Knowledge"}', 'Remote', '2025-04-15', '2025-10-15', '{"email": "emily@example.com", "phone": "456-789-0123"}', 210, '2025-02-18 10:15:00+00', '2025-02-24 13:40:00+00', 'Not Started', false, '2025-03-27 19:00:11.123823');
INSERT INTO public.projects VALUES ('4a0d03a9-b4f5-4ee3-ba94-57453170b012', 'Blockchain-Based Supply Chain Tracking', 'Building a platform that uses blockchain technology to track products through the supply chain, ensuring transparency and authenticity.', '77309254-f7b7-4d6a-8b18-05a93e647c09', true, 'Looking for technical co-founder', '{Blockchain,"Supply Chain",Logistics}', '{"Blockchain Development","Smart Contracts","Full-stack Development","Supply Chain Knowledge"}', 'Hybrid', '2025-05-01', '2026-05-01', '{"email": "michael@example.com", "phone": "567-890-1234"}', 150, '2025-02-20 08:30:00+00', '2025-02-26 09:15:00+00', 'Idea Phase', false, '2025-03-27 19:00:11.123823');
INSERT INTO public.projects VALUES ('c7cb0be3-83ad-47a6-b2d2-496583ef6891', 'AR Campus Tour Guide', 'Developing an augmented reality application that provides interactive tours of the Texas A&M campus for prospective students and visitors.', 'c46ddab3-a647-479c-865b-c29216f07802', false, 'Recruiting team members', '{"Augmented Reality",Education,"Mobile Apps"}', '{"AR Development",Unity,"3D Modeling","Mobile Development"}', 'In-person', '2025-03-20', '2025-08-20', '{"email": "john@example.com", "phone": "123-456-7890"}', 175, '2025-02-12 11:20:00+00', '2025-02-23 14:10:00+00', 'Not Started', false, '2025-03-27 19:00:11.123823');
INSERT INTO public.projects VALUES ('0c49ad34-99e7-423a-b8b6-751b47b84803', 'Mobile App for Local Farmers Markets - DB', 'Creating an app that connects local farmers with consumers, showing real-time inventory and locations', '3eb8b77f-5f14-45a3-922e-f5b1f41f6395', true, 'Looking for co-founders', '{Agriculture,"Mobile Apps"}', '{"React Native","UX Design","Backend Development"}', 'Hybrid', NULL, NULL, '{}', 0, '2025-03-24 22:12:31.436887+00', '2025-03-24 22:12:31.436887+00', 'Idea Phase', false, '2025-03-27 19:00:23.284362');


--
-- Data for Name: user_bookmarks; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.user_bookmarks VALUES ('1ba02128-1b3c-4620-bdbe-4ada0d616da0', 'c46ddab3-a647-479c-865b-c29216f07802', '3eb8b77f-5f14-45a3-922e-f5b1f41f6395', '2025-02-15 10:30:00+00');
INSERT INTO public.user_bookmarks VALUES ('18aef883-419e-4c7d-8970-c139fa64f5d5', 'c46ddab3-a647-479c-865b-c29216f07802', 'd69452b3-29e9-4661-8ebc-e57dcb3f0ab7', '2025-02-18 14:45:00+00');
INSERT INTO public.user_bookmarks VALUES ('44116a23-7494-4c96-8212-734404ab598e', '3eb8b77f-5f14-45a3-922e-f5b1f41f6395', 'c46ddab3-a647-479c-865b-c29216f07802', '2025-02-20 09:15:00+00');


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.users VALUES ('c46ddab3-a647-479c-865b-c29216f07802', 'John Doe', 'john@example.com', 'Full-stack developer with 5 years of experience', '{"Software Development","Web Development"}', '{React,Node.js,TypeScript,MongoDB}', 'https://linkedin.com/in/johndoe', 'https://johndoe.dev', '/resume/johndoe.pdf', '[{"url": "https://github.com/johndoe", "title": "GitHub"}]', '{"email": "john@example.com", "phone": "123-456-7890"}', 120, 2022, true, '/placeholder.svg?height=100&width=100', NULL, '2025-03-24 20:16:22.925751+00', '2025-03-26 21:44:26.84241+00', NULL, false, false);
INSERT INTO public.users VALUES ('3eb8b77f-5f14-45a3-922e-f5b1f41f6395', 'Jane Smith', 'jane@example.com', 'UX/UI designer specializing in user research and interface design', '{Design,"User Experience"}', '{Figma,"Adobe XD","User Research",Prototyping}', 'https://linkedin.com/in/janesmith', 'https://janesmith.design', '/resume/janesmith.pdf', '[{"url": "https://dribbble.com/janesmith", "title": "Dribbble"}]', '{"email": "jane@example.com", "phone": "234-567-8901"}', 85, 2023, true, '/placeholder.svg?height=100&width=100', NULL, '2025-03-24 20:16:22.925751+00', '2025-03-26 21:44:26.84241+00', NULL, false, false);
INSERT INTO public.users VALUES ('d69452b3-29e9-4661-8ebc-e57dcb3f0ab7', 'Robert Johnson', 'robert@example.com', 'Entrepreneur with experience in launching tech startups', '{Entrepreneurship,"Business Development"}', '{"Business Strategy",Fundraising,Marketing,"Team Building"}', 'https://linkedin.com/in/robertjohnson', 'https://robertjohnson.co', '/resume/robertjohnson.pdf', '[{"url": "https://angel.co/robertjohnson", "title": "AngelList"}]', '{"email": "robert@example.com", "phone": "345-678-9012"}', 150, 2020, false, '/placeholder.svg?height=100&width=100', NULL, '2025-03-24 20:16:22.925751+00', '2025-03-26 21:44:26.84241+00', NULL, false, false);
INSERT INTO public.users VALUES ('77309254-f7b7-4d6a-8b18-05a93e647c09', 'Michael Brown', 'michael@example.com', 'Product manager with a background in software engineering', '{"Product Management","Software Development"}', '{"Product Strategy",Agile,"User Stories",Roadmapping}', 'https://linkedin.com/in/michaelbrown', 'https://michaelbrown.me', '/resume/michaelbrown.pdf', '[{"url": "https://medium.com/@michaelbrown", "title": "Medium"}]', '{"email": "michael@example.com", "phone": "567-890-1234"}', 110, 2019, true, '/placeholder.svg?height=100&width=100', NULL, '2025-03-24 20:16:22.925751+00', '2025-03-26 21:44:26.84241+00', NULL, false, false);
INSERT INTO public.users VALUES ('861d6f58-a1c9-4271-8e78-4ad9087735b9', 'Alex Wilson', 'alex@example.com', 'Software engineer focused on web performance', '{"Software Development","Web Performance"}', '{JavaScript,React,"Performance Optimization"}', NULL, NULL, NULL, '[]', '{}', 0, 2024, true, NULL, NULL, '2025-03-24 22:07:01.558742+00', '2025-03-26 21:44:26.84241+00', NULL, false, false);
INSERT INTO public.users VALUES ('190d1ee3-45ab-41e5-b872-617e2ad47ec8', 'Emily Chen - DB', 'emily@example.com', 'Data scientist with expertise in machine learning and AI', '{"Data Science","Artificial Intelligence"}', '{Python,TensorFlow,"Data Analysis","Machine Learning"}', 'https://linkedin.com/in/emilychen', 'https://emilychen.io', '/resume/emilychen.pdf', '[{"url": "https://kaggle.com/emilychen", "title": "Kaggle"}]', '{"email": "emily@example.com", "phone": "456-789-0123"}', 96, 2021, false, '/placeholder.svg?height=100&width=100', NULL, '2025-03-24 20:16:22.925751+00', '2025-03-27 19:04:07.104577+00', NULL, false, false);


--
-- Name: events events_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.events
    ADD CONSTRAINT events_pkey PRIMARY KEY (id);


--
-- Name: project_bookmarks project_bookmarks_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.project_bookmarks
    ADD CONSTRAINT project_bookmarks_pkey PRIMARY KEY (id);


--
-- Name: project_bookmarks project_bookmarks_user_id_project_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.project_bookmarks
    ADD CONSTRAINT project_bookmarks_user_id_project_id_key UNIQUE (user_id, project_id);


--
-- Name: projects projects_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.projects
    ADD CONSTRAINT projects_pkey PRIMARY KEY (id);


--
-- Name: user_bookmarks user_bookmarks_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_bookmarks
    ADD CONSTRAINT user_bookmarks_pkey PRIMARY KEY (id);


--
-- Name: user_bookmarks user_bookmarks_user_id_bookmarked_user_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_bookmarks
    ADD CONSTRAINT user_bookmarks_user_id_bookmarked_user_id_key UNIQUE (user_id, bookmarked_user_id);


--
-- Name: users users_email_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key UNIQUE (email);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: idx_projects_industry; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_projects_industry ON public.projects USING gin (industry);


--
-- Name: idx_projects_owner_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_projects_owner_id ON public.projects USING btree (owner_id);


--
-- Name: idx_projects_required_skills; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_projects_required_skills ON public.projects USING gin (required_skills);


--
-- Name: idx_users_industry; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_users_industry ON public.users USING gin (industry);


--
-- Name: idx_users_skills; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_users_skills ON public.users USING gin (skills);


--
-- Name: events update_events_modtime; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_events_modtime BEFORE UPDATE ON public.events FOR EACH ROW EXECUTE FUNCTION public.update_modified_column();


--
-- Name: projects update_projects_modtime; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_projects_modtime BEFORE UPDATE ON public.projects FOR EACH ROW EXECUTE FUNCTION public.update_modified_column();


--
-- Name: projects update_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_updated_at BEFORE UPDATE ON public.projects FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- Name: users update_users_modtime; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_users_modtime BEFORE UPDATE ON public.users FOR EACH ROW EXECUTE FUNCTION public.update_modified_column();


--
-- Name: events events_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.events
    ADD CONSTRAINT events_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: project_bookmarks project_bookmarks_project_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.project_bookmarks
    ADD CONSTRAINT project_bookmarks_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.projects(id) ON DELETE CASCADE;


--
-- Name: project_bookmarks project_bookmarks_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.project_bookmarks
    ADD CONSTRAINT project_bookmarks_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: projects projects_owner_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.projects
    ADD CONSTRAINT projects_owner_id_fkey FOREIGN KEY (owner_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: user_bookmarks user_bookmarks_bookmarked_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_bookmarks
    ADD CONSTRAINT user_bookmarks_bookmarked_user_id_fkey FOREIGN KEY (bookmarked_user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: user_bookmarks user_bookmarks_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_bookmarks
    ADD CONSTRAINT user_bookmarks_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--

