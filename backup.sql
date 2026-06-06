--
-- PostgreSQL database dump
--

\restrict 6YJEoJjaesbG87VWFhNaF5eaf2h8m4BCqMxSbkMEkgiZQZaR7S8YF7EzAlKaTg2

-- Dumped from database version 16.13
-- Dumped by pg_dump version 16.13

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: drizzle; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA drizzle;


--
-- Name: balance_ledger_type; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.balance_ledger_type AS ENUM (
    'MATCH_CHARGE',
    'FINE_CHARGE',
    'PAYMENT_CREDIT',
    'ADJUSTMENT',
    'FINE_REVERSAL'
);


--
-- Name: event_type; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.event_type AS ENUM (
    'GOAL',
    'YELLOW_CARD',
    'RED_CARD',
    'SUBSTITUTION',
    'FOUL'
);


--
-- Name: fine_status; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.fine_status AS ENUM (
    'PENDING',
    'PAID'
);


--
-- Name: match_status; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.match_status AS ENUM (
    'SCHEDULED',
    'IN_PROGRESS',
    'FINISHED'
);


--
-- Name: payment_method; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.payment_method AS ENUM (
    'CASH',
    'TRANSFER'
);


--
-- Name: payment_status; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.payment_status AS ENUM (
    'PENDING',
    'APPROVED',
    'REJECTED'
);


--
-- Name: round_status; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.round_status AS ENUM (
    'OPEN',
    'CLOSED'
);


--
-- Name: sport_type; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.sport_type AS ENUM (
    'FOOTBALL',
    'FUTSAL'
);


--
-- Name: suspension_reason; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.suspension_reason AS ENUM (
    'YELLOW_ACCUMULATION',
    'RED_CARD_DIRECT'
);


--
-- Name: suspension_status; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.suspension_status AS ENUM (
    'PENDING',
    'SERVED',
    'CANCELLED'
);


--
-- Name: tournament_format; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.tournament_format AS ENUM (
    'ROUND_ROBIN',
    'GROUPS_ELIMINATION',
    'DIRECT_ELIMINATION'
);


--
-- Name: tournament_status; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.tournament_status AS ENUM (
    'DRAFT',
    'ACTIVE',
    'FINISHED'
);


--
-- Name: user_role; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.user_role AS ENUM (
    'SUPER_ADMIN',
    'VOCAL',
    'DELEGATE',
    'PLATFORM_ADMIN'
);


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: __drizzle_migrations; Type: TABLE; Schema: drizzle; Owner: -
--

CREATE TABLE drizzle.__drizzle_migrations (
    id integer NOT NULL,
    hash text NOT NULL,
    created_at bigint
);


--
-- Name: __drizzle_migrations_id_seq; Type: SEQUENCE; Schema: drizzle; Owner: -
--

CREATE SEQUENCE drizzle.__drizzle_migrations_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: __drizzle_migrations_id_seq; Type: SEQUENCE OWNED BY; Schema: drizzle; Owner: -
--

ALTER SEQUENCE drizzle.__drizzle_migrations_id_seq OWNED BY drizzle.__drizzle_migrations.id;


--
-- Name: balance_ledger; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.balance_ledger (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    team_id uuid NOT NULL,
    tournament_id uuid NOT NULL,
    match_id uuid,
    fine_id uuid,
    payment_id uuid,
    type public.balance_ledger_type NOT NULL,
    amount double precision NOT NULL,
    description text NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: fines; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.fines (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    team_id uuid NOT NULL,
    tournament_id uuid NOT NULL,
    match_event_id uuid,
    amount double precision NOT NULL,
    reason text NOT NULL,
    status public.fine_status DEFAULT 'PENDING'::public.fine_status NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    match_id uuid,
    half integer DEFAULT 1 NOT NULL,
    cancelled_at timestamp without time zone
);


--
-- Name: leagues; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.leagues (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name character varying(255) NOT NULL,
    slug character varying(100) NOT NULL,
    subdomain character varying(100),
    logo_url text,
    status character varying(20) DEFAULT 'ACTIVE'::character varying NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: match_events; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.match_events (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    match_id uuid NOT NULL,
    team_id uuid NOT NULL,
    player_id uuid,
    player_out_id uuid,
    event_type public.event_type NOT NULL,
    minute integer NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    cancelled_at timestamp without time zone,
    cancelled_by_id uuid,
    cancel_reason character varying(100)
);


--
-- Name: matches; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.matches (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tournament_id uuid NOT NULL,
    home_team_id uuid NOT NULL,
    away_team_id uuid NOT NULL,
    vocal_id uuid,
    phase character varying(50),
    stage integer,
    scheduled_at timestamp without time zone,
    status public.match_status DEFAULT 'SCHEDULED'::public.match_status NOT NULL,
    timer_seconds integer DEFAULT 0,
    timer_running boolean DEFAULT false,
    current_half integer DEFAULT 1,
    home_score integer DEFAULT 0,
    away_score integer DEFAULT 0,
    home_team_color character varying(7),
    away_team_color character varying(7),
    acta_pdf_url text,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: payments; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.payments (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    fine_id uuid,
    team_id uuid NOT NULL,
    receipt_url text,
    status public.payment_status DEFAULT 'PENDING'::public.payment_status NOT NULL,
    reviewed_by uuid,
    reviewed_at timestamp without time zone,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    match_id uuid,
    method public.payment_method DEFAULT 'TRANSFER'::public.payment_method NOT NULL,
    amount double precision DEFAULT 0 NOT NULL,
    tournament_id uuid
);


--
-- Name: player_suspensions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.player_suspensions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    player_id uuid NOT NULL,
    tournament_id uuid NOT NULL,
    triggered_by_match_id uuid NOT NULL,
    triggered_by_event_id uuid,
    reason public.suspension_reason NOT NULL,
    matches_suspended integer DEFAULT 1 NOT NULL,
    matches_served integer DEFAULT 0 NOT NULL,
    status public.suspension_status DEFAULT 'PENDING'::public.suspension_status NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: players; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.players (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    team_id uuid NOT NULL,
    name character varying(255) NOT NULL,
    dorsal integer NOT NULL,
    photo_url text,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: team_balances; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.team_balances (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    team_id uuid NOT NULL,
    tournament_id uuid NOT NULL,
    balance double precision DEFAULT 0 NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: teams; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.teams (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tournament_id uuid NOT NULL,
    name character varying(255) NOT NULL,
    logo_url text,
    primary_color character varying(7),
    secondary_color character varying(7),
    delegate_id uuid,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: tournament_rounds; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.tournament_rounds (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tournament_id uuid NOT NULL,
    stage integer NOT NULL,
    name character varying(100),
    status public.round_status DEFAULT 'OPEN'::public.round_status NOT NULL,
    closed_at timestamp without time zone,
    closed_by_id uuid,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: tournaments; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.tournaments (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name character varying(255) NOT NULL,
    slug character varying(255) NOT NULL,
    sport_type public.sport_type NOT NULL,
    format public.tournament_format NOT NULL,
    half_duration_minutes integer NOT NULL,
    max_roster_size integer NOT NULL,
    category character varying(100),
    status public.tournament_status DEFAULT 'DRAFT'::public.tournament_status NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    yellow_card_fine double precision DEFAULT 2000 NOT NULL,
    red_card_fine double precision DEFAULT 5000 NOT NULL,
    late_fine double precision DEFAULT 10000 NOT NULL,
    court_fee double precision DEFAULT 0 NOT NULL,
    referee_fee double precision DEFAULT 0 NOT NULL,
    referee_fee_enabled boolean DEFAULT false NOT NULL,
    logo_url text,
    logo_bg_removed_url text,
    league_id uuid NOT NULL,
    yellows_for_suspension integer DEFAULT 2 NOT NULL,
    red_card_suspension_matches integer DEFAULT 1 NOT NULL
);


--
-- Name: users; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.users (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    email character varying(255) NOT NULL,
    password_hash character varying(255) NOT NULL,
    name character varying(255) NOT NULL,
    role public.user_role NOT NULL,
    whatsapp_number character varying(20),
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    league_id uuid
);


--
-- Name: __drizzle_migrations id; Type: DEFAULT; Schema: drizzle; Owner: -
--

ALTER TABLE ONLY drizzle.__drizzle_migrations ALTER COLUMN id SET DEFAULT nextval('drizzle.__drizzle_migrations_id_seq'::regclass);


--
-- Data for Name: __drizzle_migrations; Type: TABLE DATA; Schema: drizzle; Owner: -
--

COPY drizzle.__drizzle_migrations (id, hash, created_at) FROM stdin;
1	0004_loving_captain_marvel	1779421156000
2	0006_platform_admin_enum	1780366800000
3	0007_leagues_multitenancy	1780366860000
4	0008_event_correction	1780366920000
5	0009_event_correction_columns	1780366980000
6	0010_player_suspensions	1780367040000
\.


--
-- Data for Name: balance_ledger; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.balance_ledger (id, team_id, tournament_id, match_id, fine_id, payment_id, type, amount, description, created_at) FROM stdin;
757c7c25-fcf2-405d-ba95-6e1bf18f2ddb	b1672882-3c1e-4648-81da-e1f3f99f75ab	d4b554e5-1def-4c95-9f13-f5acfe1576cc	356dfcb5-27e3-48ac-8593-a2a84120c03f	\N	3b55f8b3-fbb1-4b81-a8b8-0f4d15d217d8	PAYMENT_CREDIT	10	Pago registrado	2026-05-22 03:21:35.895624
5447a806-d895-42fe-89d3-e5cd9764ac60	b43d433f-9252-4ee0-98f0-97378f492fab	d4b554e5-1def-4c95-9f13-f5acfe1576cc	356dfcb5-27e3-48ac-8593-a2a84120c03f	\N	e0ed108d-6046-4498-a8de-7de64afca073	PAYMENT_CREDIT	10	Pago registrado	2026-05-22 03:22:02.56835
be77589a-dffa-4e6e-84d0-92386b1b24ab	d225a6fc-fa2d-462c-81f2-4eb151c93207	d4b554e5-1def-4c95-9f13-f5acfe1576cc	9c245594-e83e-4c1a-8855-c3c451dd5e91	\N	4f1f6755-4d85-4cf0-9abd-bf6d7743e018	PAYMENT_CREDIT	10	Pago registrado	2026-05-22 03:31:59.536732
f487cd48-e213-4272-aa2c-ab52491e642e	5e09ec6c-63a4-422f-83a8-c9b3f83bd84c	d4b554e5-1def-4c95-9f13-f5acfe1576cc	25405bd3-2673-46b1-a124-15c44df6de28	\N	189e97e0-a5f0-4254-9da1-df8edb32861a	PAYMENT_CREDIT	10	Pago registrado	2026-05-22 03:33:13.068075
a349c195-6fe9-46eb-a8ce-72ba2eb853ab	f381b47c-ad99-4dfb-835b-3fb79a48b031	d4b554e5-1def-4c95-9f13-f5acfe1576cc	9c245594-e83e-4c1a-8855-c3c451dd5e91	\N	05af2b50-bc33-470a-b55e-7d9448538c7b	PAYMENT_CREDIT	10	Pago registrado	2026-05-28 03:47:54.874472
\.


--
-- Data for Name: fines; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.fines (id, team_id, tournament_id, match_event_id, amount, reason, status, created_at, match_id, half, cancelled_at) FROM stdin;
93e260a4-aeff-4b97-8129-a63f21d58154	b43d433f-9252-4ee0-98f0-97378f492fab	d4b554e5-1def-4c95-9f13-f5acfe1576cc	f3f3a428-e620-43a8-ac22-b6f25b7d5117	2000	Tarjeta Amarilla	PENDING	2026-05-15 03:36:00.785377	\N	1	\N
05c1bd07-b9ef-485b-afaa-3f64a372f6d3	b43d433f-9252-4ee0-98f0-97378f492fab	d4b554e5-1def-4c95-9f13-f5acfe1576cc	affd2301-5a47-445a-b083-a6d54a25c612	2000	Tarjeta Amarilla	PENDING	2026-05-15 03:36:07.287315	\N	1	\N
b29263f5-d5b7-48be-a76f-3d2b59324697	b43d433f-9252-4ee0-98f0-97378f492fab	d4b554e5-1def-4c95-9f13-f5acfe1576cc	3ed22902-1b28-4e4e-8e86-b271a970817b	2000	Tarjeta Amarilla	PENDING	2026-05-15 03:36:11.698574	\N	1	\N
0fad6f2e-37a4-41dc-9fd4-6fc65a7354e6	b43d433f-9252-4ee0-98f0-97378f492fab	d4b554e5-1def-4c95-9f13-f5acfe1576cc	e9ab2835-56ab-4352-b046-7cf20e3f820a	2000	Tarjeta Amarilla	PENDING	2026-05-15 03:39:34.545803	\N	1	\N
342ebaaf-61b5-4c56-936c-8fcdb4c4ef94	b43d433f-9252-4ee0-98f0-97378f492fab	d4b554e5-1def-4c95-9f13-f5acfe1576cc	5cd9cd55-831c-4e0b-a013-1a34a257a206	2000	Tarjeta Amarilla	PENDING	2026-05-15 03:39:41.687809	\N	1	\N
0c9aa4dd-7949-4b07-892b-7377079c67d6	5e09ec6c-63a4-422f-83a8-c9b3f83bd84c	d4b554e5-1def-4c95-9f13-f5acfe1576cc	1f5179c2-359a-4cb7-a30b-3a18620b920d	2000	Tarjeta Amarilla	PENDING	2026-05-15 03:40:06.389916	\N	1	\N
63e77102-d046-4133-b605-8fbfccc83d12	5e09ec6c-63a4-422f-83a8-c9b3f83bd84c	d4b554e5-1def-4c95-9f13-f5acfe1576cc	72d85437-4800-4af1-a236-91c4e869ef58	2000	Tarjeta Amarilla	PENDING	2026-05-15 03:40:14.886733	\N	1	\N
5eecff5d-ba44-412b-b56f-4b464c5806b4	5e09ec6c-63a4-422f-83a8-c9b3f83bd84c	d4b554e5-1def-4c95-9f13-f5acfe1576cc	9bec3c44-35d0-4987-8830-e45e35e8016c	2000	Tarjeta Amarilla	PENDING	2026-05-15 03:52:26.892614	\N	1	\N
cfabf688-7eee-4b95-b0ff-f6b61ca118dd	5e09ec6c-63a4-422f-83a8-c9b3f83bd84c	d4b554e5-1def-4c95-9f13-f5acfe1576cc	bb662b2e-e2cd-40a2-bb59-ab528b398b51	2000	Tarjeta Amarilla	PENDING	2026-05-15 03:52:32.021329	\N	1	\N
66e583f5-0a0e-4b62-a852-9ff50f9a9b4d	5e09ec6c-63a4-422f-83a8-c9b3f83bd84c	d4b554e5-1def-4c95-9f13-f5acfe1576cc	b5097cc2-af52-4b61-8a58-707151c197a9	5000	Tarjeta Roja	PENDING	2026-05-15 03:52:38.204881	\N	1	\N
86acbf3f-f457-41fd-9e17-3aeb088fd251	069ab702-1a65-4474-8175-952c329cbe8a	d4b554e5-1def-4c95-9f13-f5acfe1576cc	470ddf5c-e5c4-4b0e-ac5c-c5418deb64a8	2000	Tarjeta Amarilla	PENDING	2026-05-15 03:59:07.031629	\N	1	\N
6060781d-2b94-4a61-a9df-bbf261af638c	069ab702-1a65-4474-8175-952c329cbe8a	d4b554e5-1def-4c95-9f13-f5acfe1576cc	3d3b7034-97ee-448b-b994-2111cb3fca8a	2000	Tarjeta Amarilla	PENDING	2026-05-15 03:59:11.071318	\N	1	\N
3c6c3788-8e00-40ce-bcf2-c65beaf50ce5	069ab702-1a65-4474-8175-952c329cbe8a	d4b554e5-1def-4c95-9f13-f5acfe1576cc	b7bea766-b677-4897-be4f-36de0f1faf17	5000	Tarjeta Roja	PENDING	2026-05-15 03:59:11.101335	\N	1	\N
5f04c6ad-c5df-4486-943c-dfaa10698064	5e09ec6c-63a4-422f-83a8-c9b3f83bd84c	d4b554e5-1def-4c95-9f13-f5acfe1576cc	da2d48e9-6d40-443e-80fe-66bc032fd0bf	5000	Tarjeta Roja	PENDING	2026-05-19 01:27:40.124715	231f36c9-d1cc-4fae-a158-987809b08dc0	2	\N
38f344de-c1cb-4a02-abec-9c64d926b1b2	5e09ec6c-63a4-422f-83a8-c9b3f83bd84c	d4b554e5-1def-4c95-9f13-f5acfe1576cc	10d2fe57-06dd-4307-8294-65ea05a1a072	2000	Tarjeta Amarilla	PENDING	2026-05-19 01:27:43.930664	231f36c9-d1cc-4fae-a158-987809b08dc0	2	\N
2da1b8e1-d7aa-4c04-ac4c-dbeafe1e62b5	f381b47c-ad99-4dfb-835b-3fb79a48b031	d4b554e5-1def-4c95-9f13-f5acfe1576cc	e4afde52-aa6c-4787-8fff-9355f73dda2f	2000	Tarjeta Amarilla	PENDING	2026-05-19 01:35:29.475336	d5194a14-eccf-4814-96ec-01557807b764	1	\N
93ae43ff-4cba-472a-b7ab-61b0cecd2b0d	b43d433f-9252-4ee0-98f0-97378f492fab	d4b554e5-1def-4c95-9f13-f5acfe1576cc	be765faa-8c27-4948-be37-d95fd3f96792	2000	Tarjeta Amarilla	PENDING	2026-05-19 01:48:03.568848	d5194a14-eccf-4814-96ec-01557807b764	1	\N
16b09d07-9586-48e1-9043-6927a89e86d0	2760dc3c-963b-44af-b94a-105009e627e2	d4b554e5-1def-4c95-9f13-f5acfe1576cc	1be0e22e-290e-4a9e-9037-7427d3802382	2000	Tarjeta Amarilla	PENDING	2026-05-20 04:35:00.745739	16dd2e26-2bbe-4a96-8a2a-fea31f1abf7c	1	\N
0865cc74-9515-48cc-a665-a0e597363340	069ab702-1a65-4474-8175-952c329cbe8a	d4b554e5-1def-4c95-9f13-f5acfe1576cc	bec5b639-d4f0-4489-8367-41213c1f04dd	2000	Tarjeta Amarilla	PAID	2026-05-20 04:26:38.781079	16dd2e26-2bbe-4a96-8a2a-fea31f1abf7c	1	\N
\.


--
-- Data for Name: leagues; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.leagues (id, name, slug, subdomain, logo_url, status, created_at) FROM stdin;
00000000-0000-0000-0000-000000000001	Mi Liga	piloto	piloto	\N	ACTIVE	2026-06-03 03:00:09.849391
\.


--
-- Data for Name: match_events; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.match_events (id, match_id, team_id, player_id, player_out_id, event_type, minute, created_at, cancelled_at, cancelled_by_id, cancel_reason) FROM stdin;
5cc00c4a-6502-4d54-99b7-47bdfdc2219d	356dfcb5-27e3-48ac-8593-a2a84120c03f	b43d433f-9252-4ee0-98f0-97378f492fab	75ab1b54-ac2b-41df-b0b6-cee21184ee4e	\N	GOAL	0	2026-05-15 03:35:42.813821	\N	\N	\N
f3f3a428-e620-43a8-ac22-b6f25b7d5117	356dfcb5-27e3-48ac-8593-a2a84120c03f	b43d433f-9252-4ee0-98f0-97378f492fab	aadef879-c3f9-4f43-983f-641317fed6c6	\N	YELLOW_CARD	0	2026-05-15 03:36:00.767047	\N	\N	\N
affd2301-5a47-445a-b083-a6d54a25c612	356dfcb5-27e3-48ac-8593-a2a84120c03f	b43d433f-9252-4ee0-98f0-97378f492fab	aadef879-c3f9-4f43-983f-641317fed6c6	\N	YELLOW_CARD	0	2026-05-15 03:36:07.272597	\N	\N	\N
3ed22902-1b28-4e4e-8e86-b271a970817b	356dfcb5-27e3-48ac-8593-a2a84120c03f	b43d433f-9252-4ee0-98f0-97378f492fab	aadef879-c3f9-4f43-983f-641317fed6c6	\N	YELLOW_CARD	0	2026-05-15 03:36:11.685932	\N	\N	\N
e9ab2835-56ab-4352-b046-7cf20e3f820a	356dfcb5-27e3-48ac-8593-a2a84120c03f	b43d433f-9252-4ee0-98f0-97378f492fab	aadef879-c3f9-4f43-983f-641317fed6c6	\N	YELLOW_CARD	4	2026-05-15 03:39:34.529506	\N	\N	\N
5cd9cd55-831c-4e0b-a013-1a34a257a206	356dfcb5-27e3-48ac-8593-a2a84120c03f	b43d433f-9252-4ee0-98f0-97378f492fab	aadef879-c3f9-4f43-983f-641317fed6c6	\N	YELLOW_CARD	4	2026-05-15 03:39:41.672882	\N	\N	\N
1f5179c2-359a-4cb7-a30b-3a18620b920d	25405bd3-2673-46b1-a124-15c44df6de28	5e09ec6c-63a4-422f-83a8-c9b3f83bd84c	a42707f2-bf3b-4048-b700-9ed8628c9b8a	\N	YELLOW_CARD	0	2026-05-15 03:40:06.376933	\N	\N	\N
72d85437-4800-4af1-a236-91c4e869ef58	25405bd3-2673-46b1-a124-15c44df6de28	5e09ec6c-63a4-422f-83a8-c9b3f83bd84c	a42707f2-bf3b-4048-b700-9ed8628c9b8a	\N	YELLOW_CARD	0	2026-05-15 03:40:14.864417	\N	\N	\N
9bec3c44-35d0-4987-8830-e45e35e8016c	25405bd3-2673-46b1-a124-15c44df6de28	5e09ec6c-63a4-422f-83a8-c9b3f83bd84c	7e38d407-528b-4387-a71f-d94f8efd504a	\N	YELLOW_CARD	12	2026-05-15 03:52:26.879587	\N	\N	\N
bb662b2e-e2cd-40a2-bb59-ab528b398b51	25405bd3-2673-46b1-a124-15c44df6de28	5e09ec6c-63a4-422f-83a8-c9b3f83bd84c	7e38d407-528b-4387-a71f-d94f8efd504a	\N	YELLOW_CARD	12	2026-05-15 03:52:32.006243	\N	\N	\N
b5097cc2-af52-4b61-8a58-707151c197a9	25405bd3-2673-46b1-a124-15c44df6de28	5e09ec6c-63a4-422f-83a8-c9b3f83bd84c	a3ef56c8-5879-4357-9241-79a80320f7b7	\N	RED_CARD	12	2026-05-15 03:52:38.18968	\N	\N	\N
e21f6f74-d8fc-4732-a6e2-3171221088ae	4d5ed019-e5f3-419a-958c-214748d2fcbe	069ab702-1a65-4474-8175-952c329cbe8a	314f0498-9905-4bb8-9f64-35974804e79a	\N	GOAL	0	2026-05-15 03:59:03.602207	\N	\N	\N
470ddf5c-e5c4-4b0e-ac5c-c5418deb64a8	4d5ed019-e5f3-419a-958c-214748d2fcbe	069ab702-1a65-4474-8175-952c329cbe8a	3773564a-87c7-41c6-90df-8ce9ed2331a6	\N	YELLOW_CARD	0	2026-05-15 03:59:07.010553	\N	\N	\N
3d3b7034-97ee-448b-b994-2111cb3fca8a	4d5ed019-e5f3-419a-958c-214748d2fcbe	069ab702-1a65-4474-8175-952c329cbe8a	3773564a-87c7-41c6-90df-8ce9ed2331a6	\N	YELLOW_CARD	0	2026-05-15 03:59:11.055927	\N	\N	\N
b7bea766-b677-4897-be4f-36de0f1faf17	4d5ed019-e5f3-419a-958c-214748d2fcbe	069ab702-1a65-4474-8175-952c329cbe8a	3773564a-87c7-41c6-90df-8ce9ed2331a6	\N	RED_CARD	0	2026-05-15 03:59:11.085156	\N	\N	\N
1062ae78-3a10-43d7-9d38-9cafcf739cc9	4d5ed019-e5f3-419a-958c-214748d2fcbe	b1672882-3c1e-4648-81da-e1f3f99f75ab	f6a34ee1-0a51-4eb6-a5ca-66f5b0eb063f	\N	GOAL	12	2026-05-15 04:11:24.633064	\N	\N	\N
da2d48e9-6d40-443e-80fe-66bc032fd0bf	231f36c9-d1cc-4fae-a158-987809b08dc0	5e09ec6c-63a4-422f-83a8-c9b3f83bd84c	\N	\N	RED_CARD	1	2026-05-19 01:27:40.109133	\N	\N	\N
10d2fe57-06dd-4307-8294-65ea05a1a072	231f36c9-d1cc-4fae-a158-987809b08dc0	5e09ec6c-63a4-422f-83a8-c9b3f83bd84c	\N	\N	YELLOW_CARD	1	2026-05-19 01:27:43.91485	\N	\N	\N
11916e1c-9716-4415-92a7-0f964aa48725	d5194a14-eccf-4814-96ec-01557807b764	b43d433f-9252-4ee0-98f0-97378f492fab	\N	\N	FOUL	0	2026-05-19 01:31:13.100901	\N	\N	\N
7af27d51-6109-4a23-81e0-46fd53335775	d5194a14-eccf-4814-96ec-01557807b764	b43d433f-9252-4ee0-98f0-97378f492fab	\N	\N	FOUL	4	2026-05-19 01:35:21.299834	\N	\N	\N
208af41d-2896-443e-984c-ca779d612267	d5194a14-eccf-4814-96ec-01557807b764	b43d433f-9252-4ee0-98f0-97378f492fab	\N	\N	FOUL	4	2026-05-19 01:35:22.516559	\N	\N	\N
3dd49fa2-04e7-4702-867f-86754eb7d9d6	d5194a14-eccf-4814-96ec-01557807b764	b43d433f-9252-4ee0-98f0-97378f492fab	\N	\N	FOUL	4	2026-05-19 01:35:23.323181	\N	\N	\N
79be7caf-d908-4c5c-b758-fe9c2ac52e0e	d5194a14-eccf-4814-96ec-01557807b764	b43d433f-9252-4ee0-98f0-97378f492fab	\N	\N	FOUL	4	2026-05-19 01:35:24.539316	\N	\N	\N
dd9eb22f-1a0c-43f4-8d6b-8139e1105236	d5194a14-eccf-4814-96ec-01557807b764	f381b47c-ad99-4dfb-835b-3fb79a48b031	\N	\N	FOUL	4	2026-05-19 01:35:25.762321	\N	\N	\N
e4afde52-aa6c-4787-8fff-9355f73dda2f	d5194a14-eccf-4814-96ec-01557807b764	f381b47c-ad99-4dfb-835b-3fb79a48b031	\N	\N	YELLOW_CARD	4	2026-05-19 01:35:29.461274	\N	\N	\N
ee7437e4-c778-4c9a-88e5-30ad1e91699e	d5194a14-eccf-4814-96ec-01557807b764	f381b47c-ad99-4dfb-835b-3fb79a48b031	\N	\N	GOAL	4	2026-05-19 01:35:31.368697	\N	\N	\N
be765faa-8c27-4948-be37-d95fd3f96792	d5194a14-eccf-4814-96ec-01557807b764	b43d433f-9252-4ee0-98f0-97378f492fab	\N	\N	YELLOW_CARD	16	2026-05-19 01:48:03.557514	\N	\N	\N
ca2e1d28-b2fa-4254-8abc-001057891d44	d5194a14-eccf-4814-96ec-01557807b764	b43d433f-9252-4ee0-98f0-97378f492fab	\N	\N	FOUL	16	2026-05-19 01:48:05.003463	\N	\N	\N
7bf572c3-a50f-484a-a7f3-b49e84347819	d5194a14-eccf-4814-96ec-01557807b764	b43d433f-9252-4ee0-98f0-97378f492fab	\N	\N	FOUL	16	2026-05-19 01:48:05.842624	\N	\N	\N
9cf3b587-1095-4b1a-81ae-a4ca8943b27a	16dd2e26-2bbe-4a96-8a2a-fea31f1abf7c	069ab702-1a65-4474-8175-952c329cbe8a	\N	\N	GOAL	0	2026-05-20 04:26:34.812623	\N	\N	\N
bec5b639-d4f0-4489-8367-41213c1f04dd	16dd2e26-2bbe-4a96-8a2a-fea31f1abf7c	069ab702-1a65-4474-8175-952c329cbe8a	\N	\N	YELLOW_CARD	0	2026-05-20 04:26:38.771951	\N	\N	\N
02287b9d-ec84-4af0-9546-e3dea2566d71	16dd2e26-2bbe-4a96-8a2a-fea31f1abf7c	069ab702-1a65-4474-8175-952c329cbe8a	\N	\N	FOUL	0	2026-05-20 04:26:40.143503	\N	\N	\N
7895e50c-e4d1-4530-b24d-8f84b8525a48	16dd2e26-2bbe-4a96-8a2a-fea31f1abf7c	069ab702-1a65-4474-8175-952c329cbe8a	\N	\N	FOUL	0	2026-05-20 04:26:41.897033	\N	\N	\N
67f772a3-2eb2-4bec-9b04-7cfcb2f82867	16dd2e26-2bbe-4a96-8a2a-fea31f1abf7c	2760dc3c-963b-44af-b94a-105009e627e2	\N	\N	GOAL	0	2026-05-20 04:26:49.873306	\N	\N	\N
23b1675c-de14-43c1-bf14-5f1e95c6ee6e	16dd2e26-2bbe-4a96-8a2a-fea31f1abf7c	069ab702-1a65-4474-8175-952c329cbe8a	\N	\N	FOUL	0	2026-05-20 04:34:54.753415	\N	\N	\N
29a8ef51-4029-405f-8cfe-fdaec2b15037	16dd2e26-2bbe-4a96-8a2a-fea31f1abf7c	069ab702-1a65-4474-8175-952c329cbe8a	\N	\N	FOUL	0	2026-05-20 04:34:56.039802	\N	\N	\N
2572c01b-7449-444d-b062-883046cd43d2	16dd2e26-2bbe-4a96-8a2a-fea31f1abf7c	2760dc3c-963b-44af-b94a-105009e627e2	\N	\N	GOAL	0	2026-05-20 04:34:58.444987	\N	\N	\N
1be0e22e-290e-4a9e-9037-7427d3802382	16dd2e26-2bbe-4a96-8a2a-fea31f1abf7c	2760dc3c-963b-44af-b94a-105009e627e2	\N	\N	YELLOW_CARD	0	2026-05-20 04:35:00.737439	\N	\N	\N
\.


--
-- Data for Name: matches; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.matches (id, tournament_id, home_team_id, away_team_id, vocal_id, phase, stage, scheduled_at, status, timer_seconds, timer_running, current_half, home_score, away_score, home_team_color, away_team_color, acta_pdf_url, created_at) FROM stdin;
66c7066d-a178-4d73-a577-3c8f31a19459	d4b554e5-1def-4c95-9f13-f5acfe1576cc	069ab702-1a65-4474-8175-952c329cbe8a	f381b47c-ad99-4dfb-835b-3fb79a48b031	\N	ROUND_ROBIN	4	\N	SCHEDULED	0	f	1	0	0	\N	\N	\N	2026-05-14 23:40:38.199856
4f4c24ee-35a3-46c6-8e31-c31d71d8ff79	d4b554e5-1def-4c95-9f13-f5acfe1576cc	2760dc3c-963b-44af-b94a-105009e627e2	d225a6fc-fa2d-462c-81f2-4eb151c93207	\N	ROUND_ROBIN	4	\N	SCHEDULED	0	f	1	0	0	\N	\N	\N	2026-05-14 23:40:38.199856
ec17122e-e987-4f30-bafa-d6a128638fe6	d4b554e5-1def-4c95-9f13-f5acfe1576cc	b1672882-3c1e-4648-81da-e1f3f99f75ab	5e09ec6c-63a4-422f-83a8-c9b3f83bd84c	\N	ROUND_ROBIN	4	\N	SCHEDULED	0	f	1	0	0	\N	\N	\N	2026-05-14 23:40:38.199856
6dc7e540-8b31-4b74-b382-8fa2bd2a17bc	d4b554e5-1def-4c95-9f13-f5acfe1576cc	069ab702-1a65-4474-8175-952c329cbe8a	d225a6fc-fa2d-462c-81f2-4eb151c93207	\N	ROUND_ROBIN	5	\N	SCHEDULED	0	f	1	0	0	\N	\N	\N	2026-05-14 23:40:38.199856
2ab87bf8-f2ac-4e5a-b225-ee024df53c43	d4b554e5-1def-4c95-9f13-f5acfe1576cc	f381b47c-ad99-4dfb-835b-3fb79a48b031	5e09ec6c-63a4-422f-83a8-c9b3f83bd84c	\N	ROUND_ROBIN	5	\N	SCHEDULED	0	f	1	0	0	\N	\N	\N	2026-05-14 23:40:38.199856
77447551-a415-4020-aa86-4b092ce0c4f8	d4b554e5-1def-4c95-9f13-f5acfe1576cc	2760dc3c-963b-44af-b94a-105009e627e2	b43d433f-9252-4ee0-98f0-97378f492fab	\N	ROUND_ROBIN	5	\N	SCHEDULED	0	f	1	0	0	\N	\N	\N	2026-05-14 23:40:38.199856
41bbff8b-3819-4406-88ca-32b027237cd7	d4b554e5-1def-4c95-9f13-f5acfe1576cc	069ab702-1a65-4474-8175-952c329cbe8a	5e09ec6c-63a4-422f-83a8-c9b3f83bd84c	\N	ROUND_ROBIN	6	\N	SCHEDULED	0	f	1	0	0	\N	\N	\N	2026-05-14 23:40:38.199856
334a794f-659c-44c8-9731-c386886086c3	d4b554e5-1def-4c95-9f13-f5acfe1576cc	d225a6fc-fa2d-462c-81f2-4eb151c93207	b43d433f-9252-4ee0-98f0-97378f492fab	\N	ROUND_ROBIN	6	\N	SCHEDULED	0	f	1	0	0	\N	\N	\N	2026-05-14 23:40:38.199856
44033d54-92bf-44ab-8159-3fd425867bac	d4b554e5-1def-4c95-9f13-f5acfe1576cc	2760dc3c-963b-44af-b94a-105009e627e2	b1672882-3c1e-4648-81da-e1f3f99f75ab	\N	ROUND_ROBIN	6	\N	SCHEDULED	0	f	1	0	0	\N	\N	\N	2026-05-14 23:40:38.199856
914a7d24-c5db-4c84-93a7-d332cc15ada6	d4b554e5-1def-4c95-9f13-f5acfe1576cc	069ab702-1a65-4474-8175-952c329cbe8a	b43d433f-9252-4ee0-98f0-97378f492fab	\N	ROUND_ROBIN	7	\N	SCHEDULED	0	f	1	0	0	\N	\N	\N	2026-05-14 23:40:38.199856
5e68e0cc-5e9f-4d00-bf17-18bf439a0a1e	d4b554e5-1def-4c95-9f13-f5acfe1576cc	d225a6fc-fa2d-462c-81f2-4eb151c93207	b1672882-3c1e-4648-81da-e1f3f99f75ab	\N	ROUND_ROBIN	7	\N	SCHEDULED	0	f	1	0	0	\N	\N	\N	2026-05-14 23:40:38.199856
74cfe078-3027-4ebc-b8a4-e310f4a73e47	d4b554e5-1def-4c95-9f13-f5acfe1576cc	f381b47c-ad99-4dfb-835b-3fb79a48b031	2760dc3c-963b-44af-b94a-105009e627e2	\N	ROUND_ROBIN	7	\N	SCHEDULED	0	f	1	0	0	\N	\N	\N	2026-05-14 23:40:38.199856
16dd2e26-2bbe-4a96-8a2a-fea31f1abf7c	d4b554e5-1def-4c95-9f13-f5acfe1576cc	069ab702-1a65-4474-8175-952c329cbe8a	2760dc3c-963b-44af-b94a-105009e627e2	\N	ROUND_ROBIN	3	2026-05-20 04:20:00	FINISHED	20	f	2	1	2	\N	\N	\N	2026-05-14 23:40:38.199856
356dfcb5-27e3-48ac-8593-a2a84120c03f	d4b554e5-1def-4c95-9f13-f5acfe1576cc	b43d433f-9252-4ee0-98f0-97378f492fab	b1672882-3c1e-4648-81da-e1f3f99f75ab	\N	ROUND_ROBIN	1	2026-05-21 00:00:00	FINISHED	270	f	1	1	0	\N	\N	\N	2026-05-14 23:40:38.199856
9c245594-e83e-4c1a-8855-c3c451dd5e91	d4b554e5-1def-4c95-9f13-f5acfe1576cc	d225a6fc-fa2d-462c-81f2-4eb151c93207	f381b47c-ad99-4dfb-835b-3fb79a48b031	\N	ROUND_ROBIN	1	2026-05-15 03:52:00	FINISHED	170	f	1	0	0	\N	\N	\N	2026-05-14 23:40:38.199856
627624c2-d751-4a0d-be34-baeb196a656b	bcfe0450-bdf8-447c-93d3-b2cc041c702c	638396d8-95b7-422f-a0b9-e3b102a5525c	c80716ee-69dd-4c7e-a502-e6fd3d592596	\N	ROUND_ROBIN	1	\N	SCHEDULED	0	f	1	0	0	\N	\N	\N	2026-05-29 02:41:33.794915
e2260a07-689c-49a9-bc2a-8f41bdaa3c9d	bcfe0450-bdf8-447c-93d3-b2cc041c702c	7f8027b1-e5cc-4d46-94d8-e90e9ad20b3b	4140ab37-754c-4cbb-809c-239ef9fedd28	\N	ROUND_ROBIN	1	\N	SCHEDULED	0	f	1	0	0	\N	\N	\N	2026-05-29 02:41:33.794915
231f36c9-d1cc-4fae-a158-987809b08dc0	d4b554e5-1def-4c95-9f13-f5acfe1576cc	5e09ec6c-63a4-422f-83a8-c9b3f83bd84c	d225a6fc-fa2d-462c-81f2-4eb151c93207	\N	ROUND_ROBIN	2	\N	FINISHED	90	f	2	0	0	\N	\N	\N	2026-05-14 23:40:38.199856
6fa6c404-6ba8-4edc-8c3e-5b37042eb9e2	bcfe0450-bdf8-447c-93d3-b2cc041c702c	3bab5ed5-2b23-4aa7-956b-105ad3bb4bff	0ee94e43-38bd-49f8-9d5d-356fae171426	\N	ROUND_ROBIN	1	\N	SCHEDULED	0	f	1	0	0	\N	\N	\N	2026-05-29 02:41:33.794915
88092191-6b21-42a3-ab00-d83a8b7e1cb4	bcfe0450-bdf8-447c-93d3-b2cc041c702c	30182d15-4333-47e0-a34a-752b34d44976	29409f30-6b65-4184-9393-78927dc8875d	\N	ROUND_ROBIN	1	\N	SCHEDULED	0	f	1	0	0	\N	\N	\N	2026-05-29 02:41:33.794915
a8de27ac-a1a9-4970-abf9-30868e27dfb6	bcfe0450-bdf8-447c-93d3-b2cc041c702c	99c066db-decf-42c2-b082-f012591a94f2	c80716ee-69dd-4c7e-a502-e6fd3d592596	\N	ROUND_ROBIN	2	\N	SCHEDULED	0	f	1	0	0	\N	\N	\N	2026-05-29 02:41:33.794915
6a3f85b9-e453-40c2-9ab0-2e9184cb4dee	bcfe0450-bdf8-447c-93d3-b2cc041c702c	638396d8-95b7-422f-a0b9-e3b102a5525c	0ee94e43-38bd-49f8-9d5d-356fae171426	\N	ROUND_ROBIN	2	\N	SCHEDULED	0	f	1	0	0	\N	\N	\N	2026-05-29 02:41:33.794915
8ccc674b-e735-4e4e-b934-e42ab345c3b8	bcfe0450-bdf8-447c-93d3-b2cc041c702c	7f8027b1-e5cc-4d46-94d8-e90e9ad20b3b	29409f30-6b65-4184-9393-78927dc8875d	\N	ROUND_ROBIN	2	\N	SCHEDULED	0	f	1	0	0	\N	\N	\N	2026-05-29 02:41:33.794915
03bac112-3db4-4910-a479-f55d0adfadee	bcfe0450-bdf8-447c-93d3-b2cc041c702c	3bab5ed5-2b23-4aa7-956b-105ad3bb4bff	30182d15-4333-47e0-a34a-752b34d44976	\N	ROUND_ROBIN	2	\N	SCHEDULED	0	f	1	0	0	\N	\N	\N	2026-05-29 02:41:33.794915
0977525e-98f7-4d69-a264-f1648362fdd8	bcfe0450-bdf8-447c-93d3-b2cc041c702c	99c066db-decf-42c2-b082-f012591a94f2	4140ab37-754c-4cbb-809c-239ef9fedd28	\N	ROUND_ROBIN	3	\N	SCHEDULED	0	f	1	0	0	\N	\N	\N	2026-05-29 02:41:33.794915
27abf266-6e4a-4c5e-ba73-5f075c7e6ab0	bcfe0450-bdf8-447c-93d3-b2cc041c702c	c80716ee-69dd-4c7e-a502-e6fd3d592596	0ee94e43-38bd-49f8-9d5d-356fae171426	\N	ROUND_ROBIN	3	\N	SCHEDULED	0	f	1	0	0	\N	\N	\N	2026-05-29 02:41:33.794915
d5194a14-eccf-4814-96ec-01557807b764	d4b554e5-1def-4c95-9f13-f5acfe1576cc	b43d433f-9252-4ee0-98f0-97378f492fab	f381b47c-ad99-4dfb-835b-3fb79a48b031	\N	ROUND_ROBIN	2	2026-05-18 14:10:00	FINISHED	1130	f	1	0	1	\N	\N	\N	2026-05-14 23:40:38.199856
c51e1f19-3c4c-4e34-872c-1e5732855628	bcfe0450-bdf8-447c-93d3-b2cc041c702c	638396d8-95b7-422f-a0b9-e3b102a5525c	30182d15-4333-47e0-a34a-752b34d44976	\N	ROUND_ROBIN	3	\N	SCHEDULED	0	f	1	0	0	\N	\N	\N	2026-05-29 02:41:33.794915
5e4e899c-9b94-44ff-8670-283c3a416400	d4b554e5-1def-4c95-9f13-f5acfe1576cc	b1672882-3c1e-4648-81da-e1f3f99f75ab	f381b47c-ad99-4dfb-835b-3fb79a48b031	\N	ROUND_ROBIN	3	2026-05-21 04:21:00	SCHEDULED	0	f	1	0	0	\N	\N	\N	2026-05-14 23:40:38.199856
f865d7b0-54fe-4bad-8d41-215609fe062b	d4b554e5-1def-4c95-9f13-f5acfe1576cc	b43d433f-9252-4ee0-98f0-97378f492fab	5e09ec6c-63a4-422f-83a8-c9b3f83bd84c	\N	ROUND_ROBIN	3	\N	SCHEDULED	0	f	1	0	0	\N	\N	\N	2026-05-14 23:40:38.199856
f58c8d7e-c942-4a35-93e5-95e585f92cc1	bcfe0450-bdf8-447c-93d3-b2cc041c702c	7f8027b1-e5cc-4d46-94d8-e90e9ad20b3b	3bab5ed5-2b23-4aa7-956b-105ad3bb4bff	\N	ROUND_ROBIN	3	\N	SCHEDULED	0	f	1	0	0	\N	\N	\N	2026-05-29 02:41:33.794915
8bcb27d3-2281-4529-9d35-344f20c35931	bcfe0450-bdf8-447c-93d3-b2cc041c702c	99c066db-decf-42c2-b082-f012591a94f2	0ee94e43-38bd-49f8-9d5d-356fae171426	\N	ROUND_ROBIN	4	\N	SCHEDULED	0	f	1	0	0	\N	\N	\N	2026-05-29 02:41:33.794915
44327d08-f873-4b02-afdd-d6ffd9d4ee33	bcfe0450-bdf8-447c-93d3-b2cc041c702c	4140ab37-754c-4cbb-809c-239ef9fedd28	29409f30-6b65-4184-9393-78927dc8875d	\N	ROUND_ROBIN	4	\N	SCHEDULED	0	f	1	0	0	\N	\N	\N	2026-05-29 02:41:33.794915
4d5ed019-e5f3-419a-958c-214748d2fcbe	d4b554e5-1def-4c95-9f13-f5acfe1576cc	069ab702-1a65-4474-8175-952c329cbe8a	b1672882-3c1e-4648-81da-e1f3f99f75ab	\N	ROUND_ROBIN	2	\N	FINISHED	850	f	2	1	1	\N	\N	\N	2026-05-14 23:40:38.199856
c83ecc6d-c0e1-4434-ad4e-cfa7c1de32df	bcfe0450-bdf8-447c-93d3-b2cc041c702c	c80716ee-69dd-4c7e-a502-e6fd3d592596	30182d15-4333-47e0-a34a-752b34d44976	\N	ROUND_ROBIN	4	\N	SCHEDULED	0	f	1	0	0	\N	\N	\N	2026-05-29 02:41:33.794915
1b68e557-396d-4da0-bb59-271a7d82919f	bcfe0450-bdf8-447c-93d3-b2cc041c702c	638396d8-95b7-422f-a0b9-e3b102a5525c	7f8027b1-e5cc-4d46-94d8-e90e9ad20b3b	\N	ROUND_ROBIN	4	\N	SCHEDULED	0	f	1	0	0	\N	\N	\N	2026-05-29 02:41:33.794915
6266d13c-4037-43ed-8134-5a32b76f1f55	bcfe0450-bdf8-447c-93d3-b2cc041c702c	99c066db-decf-42c2-b082-f012591a94f2	29409f30-6b65-4184-9393-78927dc8875d	\N	ROUND_ROBIN	5	\N	SCHEDULED	0	f	1	0	0	\N	\N	\N	2026-05-29 02:41:33.794915
25405bd3-2673-46b1-a124-15c44df6de28	d4b554e5-1def-4c95-9f13-f5acfe1576cc	5e09ec6c-63a4-422f-83a8-c9b3f83bd84c	2760dc3c-963b-44af-b94a-105009e627e2	\N	ROUND_ROBIN	1	2026-05-15 03:34:00	FINISHED	750	f	1	0	0	\N	\N	\N	2026-05-14 23:40:38.199856
dcfba03a-73b1-4209-b0eb-e15e3eeaba0e	bcfe0450-bdf8-447c-93d3-b2cc041c702c	0ee94e43-38bd-49f8-9d5d-356fae171426	30182d15-4333-47e0-a34a-752b34d44976	\N	ROUND_ROBIN	5	\N	SCHEDULED	0	f	1	0	0	\N	\N	\N	2026-05-29 02:41:33.794915
04d60bc4-01dc-420d-ae34-703e6f96a203	bcfe0450-bdf8-447c-93d3-b2cc041c702c	4140ab37-754c-4cbb-809c-239ef9fedd28	3bab5ed5-2b23-4aa7-956b-105ad3bb4bff	\N	ROUND_ROBIN	5	\N	SCHEDULED	0	f	1	0	0	\N	\N	\N	2026-05-29 02:41:33.794915
a846964e-e744-45d7-bc37-39a6b5bcdc12	bcfe0450-bdf8-447c-93d3-b2cc041c702c	c80716ee-69dd-4c7e-a502-e6fd3d592596	7f8027b1-e5cc-4d46-94d8-e90e9ad20b3b	\N	ROUND_ROBIN	5	\N	SCHEDULED	0	f	1	0	0	\N	\N	\N	2026-05-29 02:41:33.794915
79c658ad-5ca5-4d88-9383-c8ff703e0716	bcfe0450-bdf8-447c-93d3-b2cc041c702c	99c066db-decf-42c2-b082-f012591a94f2	30182d15-4333-47e0-a34a-752b34d44976	\N	ROUND_ROBIN	6	\N	SCHEDULED	0	f	1	0	0	\N	\N	\N	2026-05-29 02:41:33.794915
de3d5400-8674-457f-bb2a-9667a59b983a	bcfe0450-bdf8-447c-93d3-b2cc041c702c	29409f30-6b65-4184-9393-78927dc8875d	3bab5ed5-2b23-4aa7-956b-105ad3bb4bff	\N	ROUND_ROBIN	6	\N	SCHEDULED	0	f	1	0	0	\N	\N	\N	2026-05-29 02:41:33.794915
72a15485-c443-4a20-9a60-3f31af098b37	bcfe0450-bdf8-447c-93d3-b2cc041c702c	0ee94e43-38bd-49f8-9d5d-356fae171426	7f8027b1-e5cc-4d46-94d8-e90e9ad20b3b	\N	ROUND_ROBIN	6	\N	SCHEDULED	0	f	1	0	0	\N	\N	\N	2026-05-29 02:41:33.794915
b002fafb-792b-4bed-82f6-5cd44fde6e03	bcfe0450-bdf8-447c-93d3-b2cc041c702c	4140ab37-754c-4cbb-809c-239ef9fedd28	638396d8-95b7-422f-a0b9-e3b102a5525c	\N	ROUND_ROBIN	6	\N	SCHEDULED	0	f	1	0	0	\N	\N	\N	2026-05-29 02:41:33.794915
28d573ed-39c3-4ca5-bd55-15b736aa3df7	bcfe0450-bdf8-447c-93d3-b2cc041c702c	99c066db-decf-42c2-b082-f012591a94f2	3bab5ed5-2b23-4aa7-956b-105ad3bb4bff	\N	ROUND_ROBIN	7	\N	SCHEDULED	0	f	1	0	0	\N	\N	\N	2026-05-29 02:41:33.794915
ccb7aa4f-8ecd-4c16-b517-6e43aff21f52	bcfe0450-bdf8-447c-93d3-b2cc041c702c	30182d15-4333-47e0-a34a-752b34d44976	7f8027b1-e5cc-4d46-94d8-e90e9ad20b3b	\N	ROUND_ROBIN	7	\N	SCHEDULED	0	f	1	0	0	\N	\N	\N	2026-05-29 02:41:33.794915
56e12e8c-dd1b-4fd8-8ec0-3782ea052631	bcfe0450-bdf8-447c-93d3-b2cc041c702c	29409f30-6b65-4184-9393-78927dc8875d	638396d8-95b7-422f-a0b9-e3b102a5525c	\N	ROUND_ROBIN	7	\N	SCHEDULED	0	f	1	0	0	\N	\N	\N	2026-05-29 02:41:33.794915
7994b05d-ff91-49d6-b7c6-f14ebdc24cb5	bcfe0450-bdf8-447c-93d3-b2cc041c702c	4140ab37-754c-4cbb-809c-239ef9fedd28	c80716ee-69dd-4c7e-a502-e6fd3d592596	\N	ROUND_ROBIN	7	\N	SCHEDULED	0	f	1	0	0	\N	\N	\N	2026-05-29 02:41:33.794915
8c0624d0-9aa6-4abc-818c-6cc2c30199c5	bcfe0450-bdf8-447c-93d3-b2cc041c702c	99c066db-decf-42c2-b082-f012591a94f2	7f8027b1-e5cc-4d46-94d8-e90e9ad20b3b	\N	ROUND_ROBIN	8	\N	SCHEDULED	0	f	1	0	0	\N	\N	\N	2026-05-29 02:41:33.794915
8c5a1ff8-9c4b-4457-bf2a-5ac83fbedb7f	bcfe0450-bdf8-447c-93d3-b2cc041c702c	3bab5ed5-2b23-4aa7-956b-105ad3bb4bff	638396d8-95b7-422f-a0b9-e3b102a5525c	\N	ROUND_ROBIN	8	\N	SCHEDULED	0	f	1	0	0	\N	\N	\N	2026-05-29 02:41:33.794915
dfc48074-51fd-49db-9273-f60f92a3fc03	bcfe0450-bdf8-447c-93d3-b2cc041c702c	29409f30-6b65-4184-9393-78927dc8875d	c80716ee-69dd-4c7e-a502-e6fd3d592596	\N	ROUND_ROBIN	8	\N	SCHEDULED	0	f	1	0	0	\N	\N	\N	2026-05-29 02:41:33.794915
e972e5de-3f65-45d0-8a43-09ae3d6d356a	bcfe0450-bdf8-447c-93d3-b2cc041c702c	0ee94e43-38bd-49f8-9d5d-356fae171426	4140ab37-754c-4cbb-809c-239ef9fedd28	\N	ROUND_ROBIN	8	\N	SCHEDULED	0	f	1	0	0	\N	\N	\N	2026-05-29 02:41:33.794915
53a11411-51bf-4bc6-b78a-37e4bdf3dd90	bcfe0450-bdf8-447c-93d3-b2cc041c702c	99c066db-decf-42c2-b082-f012591a94f2	638396d8-95b7-422f-a0b9-e3b102a5525c	\N	ROUND_ROBIN	9	\N	SCHEDULED	0	f	1	0	0	\N	\N	\N	2026-05-29 02:41:33.794915
9ccd8949-c64c-4fd1-91e5-75dc7e21caa8	bcfe0450-bdf8-447c-93d3-b2cc041c702c	3bab5ed5-2b23-4aa7-956b-105ad3bb4bff	c80716ee-69dd-4c7e-a502-e6fd3d592596	\N	ROUND_ROBIN	9	\N	SCHEDULED	0	f	1	0	0	\N	\N	\N	2026-05-29 02:41:33.794915
8e143211-2354-4cc7-b0bf-88458c0d7423	bcfe0450-bdf8-447c-93d3-b2cc041c702c	30182d15-4333-47e0-a34a-752b34d44976	4140ab37-754c-4cbb-809c-239ef9fedd28	\N	ROUND_ROBIN	9	\N	SCHEDULED	0	f	1	0	0	\N	\N	\N	2026-05-29 02:41:33.794915
f18495cb-353d-42fc-8a62-29f2844ab127	bcfe0450-bdf8-447c-93d3-b2cc041c702c	29409f30-6b65-4184-9393-78927dc8875d	0ee94e43-38bd-49f8-9d5d-356fae171426	\N	ROUND_ROBIN	9	\N	SCHEDULED	0	f	1	0	0	\N	\N	\N	2026-05-29 02:41:33.794915
\.


--
-- Data for Name: payments; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.payments (id, fine_id, team_id, receipt_url, status, reviewed_by, reviewed_at, created_at, match_id, method, amount, tournament_id) FROM stdin;
86bfd88b-b91c-4d6b-9ea7-5d5ace9ebbda	\N	b43d433f-9252-4ee0-98f0-97378f492fab	https://res.cloudinary.com/deihqamm8/image/upload/v1779415972/gol-manager/general/kps8kdlb3eo34nszgwbc.jpg	APPROVED	ca6330da-13bd-4a26-9f06-905f7b376b9a	2026-05-22 02:13:24.39	2026-05-22 02:13:03.054337	356dfcb5-27e3-48ac-8593-a2a84120c03f	TRANSFER	10	\N
8d9760c3-cbbf-42a6-afb5-c2a6a91bbcbb	\N	069ab702-1a65-4474-8175-952c329cbe8a	https://res.cloudinary.com/deihqamm8/image/upload/v1779417273/gol-manager/receipts/nfmolgqdtms0r5ow2tpl.jpg	APPROVED	ca6330da-13bd-4a26-9f06-905f7b376b9a	2026-05-22 02:34:50.849	2026-05-22 02:34:35.780809	16dd2e26-2bbe-4a96-8a2a-fea31f1abf7c	TRANSFER	2010	\N
a953c402-575c-4a51-b6bb-c6d4d8874674	\N	b43d433f-9252-4ee0-98f0-97378f492fab	\N	APPROVED	\N	\N	2026-05-22 02:36:50.028848	356dfcb5-27e3-48ac-8593-a2a84120c03f	CASH	10	\N
3b55f8b3-fbb1-4b81-a8b8-0f4d15d217d8	\N	b1672882-3c1e-4648-81da-e1f3f99f75ab	\N	APPROVED	\N	\N	2026-05-22 03:21:35.880618	356dfcb5-27e3-48ac-8593-a2a84120c03f	CASH	10	d4b554e5-1def-4c95-9f13-f5acfe1576cc
e0ed108d-6046-4498-a8de-7de64afca073	\N	b43d433f-9252-4ee0-98f0-97378f492fab	https://res.cloudinary.com/deihqamm8/image/upload/v1779420107/gol-manager/receipts/hp57tfvzwj36iltwbfqk.jpg	APPROVED	ca6330da-13bd-4a26-9f06-905f7b376b9a	2026-05-22 03:22:02.537	2026-05-22 03:21:48.707874	356dfcb5-27e3-48ac-8593-a2a84120c03f	TRANSFER	10	d4b554e5-1def-4c95-9f13-f5acfe1576cc
4f1f6755-4d85-4cf0-9abd-bf6d7743e018	\N	d225a6fc-fa2d-462c-81f2-4eb151c93207	\N	APPROVED	\N	\N	2026-05-22 03:31:59.526436	9c245594-e83e-4c1a-8855-c3c451dd5e91	CASH	10	d4b554e5-1def-4c95-9f13-f5acfe1576cc
189e97e0-a5f0-4254-9da1-df8edb32861a	\N	5e09ec6c-63a4-422f-83a8-c9b3f83bd84c	\N	APPROVED	\N	\N	2026-05-22 03:33:13.061519	25405bd3-2673-46b1-a124-15c44df6de28	CASH	10	d4b554e5-1def-4c95-9f13-f5acfe1576cc
05af2b50-bc33-470a-b55e-7d9448538c7b	\N	f381b47c-ad99-4dfb-835b-3fb79a48b031	https://res.cloudinary.com/deihqamm8/image/upload/v1779420729/gol-manager/receipts/adoqjkax30nmeyp4vvnt.jpg	APPROVED	ca6330da-13bd-4a26-9f06-905f7b376b9a	2026-05-28 03:47:54.843	2026-05-22 03:32:10.599256	9c245594-e83e-4c1a-8855-c3c451dd5e91	TRANSFER	10	d4b554e5-1def-4c95-9f13-f5acfe1576cc
\.


--
-- Data for Name: player_suspensions; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.player_suspensions (id, player_id, tournament_id, triggered_by_match_id, triggered_by_event_id, reason, matches_suspended, matches_served, status, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: players; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.players (id, team_id, name, dorsal, photo_url, created_at) FROM stdin;
fc56649d-b79a-4a0b-bf5a-fbb7917b949b	069ab702-1a65-4474-8175-952c329cbe8a	Camilo Torres	7	\N	2026-05-14 23:36:43.156625
ea38e602-486e-44e6-aa89-b64c83e7aca1	069ab702-1a65-4474-8175-952c329cbe8a	Alejandro Vargas	8	\N	2026-05-14 23:36:43.606186
aadef879-c3f9-4f43-983f-641317fed6c6	b43d433f-9252-4ee0-98f0-97378f492fab	Miguel Moreno	1	\N	2026-05-14 23:36:45.025199
1b88eb5c-4d24-40b7-8c34-f7d172a31bfe	b43d433f-9252-4ee0-98f0-97378f492fab	Santiago Ortiz	2	\N	2026-05-14 23:36:45.486087
a94608bb-5eab-4cfc-8fa8-b94fcca06855	b43d433f-9252-4ee0-98f0-97378f492fab	Daniel Castro	4	\N	2026-05-14 23:36:46.41053
60dbea5d-b091-48b1-a0af-c2e0123e525f	b43d433f-9252-4ee0-98f0-97378f492fab	Mateo Herrera	5	\N	2026-05-14 23:36:46.889897
75ab1b54-ac2b-41df-b0b6-cee21184ee4e	b43d433f-9252-4ee0-98f0-97378f492fab	Ricardo Medina	6	\N	2026-05-14 23:36:47.352027
1ff5b1ae-7554-4274-86ca-96304a36e66c	b43d433f-9252-4ee0-98f0-97378f492fab	Esteban Silva	7	\N	2026-05-14 23:36:47.813099
a5c3813d-9491-4194-a43e-723fb2d16cc1	b43d433f-9252-4ee0-98f0-97378f492fab	Cristian Morales	8	\N	2026-05-14 23:36:48.290932
367d5abb-f354-4640-95db-048c76fdbc6a	5e09ec6c-63a4-422f-83a8-c9b3f83bd84c	Oscar Rojas	3	\N	2026-05-14 23:36:50.834707
180505ac-8cfe-4979-b5b6-6f7c715048f9	5e09ec6c-63a4-422f-83a8-c9b3f83bd84c	Pablo Salazar	5	\N	2026-05-14 23:36:51.739722
7e38d407-528b-4387-a71f-d94f8efd504a	5e09ec6c-63a4-422f-83a8-c9b3f83bd84c	Mauricio Mendez	6	\N	2026-05-14 23:36:52.205308
5169181d-b2d9-4ea4-9ee9-4f565a3fb76e	5e09ec6c-63a4-422f-83a8-c9b3f83bd84c	Henry Delgado	7	\N	2026-05-14 23:36:52.696924
4ec19277-d808-4e3c-8bff-a7fd94b0c5e3	5e09ec6c-63a4-422f-83a8-c9b3f83bd84c	Sergio Parra	10	\N	2026-05-14 23:36:54.094551
dfb9b9d3-5635-4e1a-8940-af6f20e07b91	d225a6fc-fa2d-462c-81f2-4eb151c93207	Freddy Mora	2	\N	2026-05-14 23:36:55.089094
0482126c-145c-4f88-9c12-be8ee3a86fb3	d225a6fc-fa2d-462c-81f2-4eb151c93207	Leonardo Romero	3	\N	2026-05-14 23:36:55.570121
6297963f-6417-4c28-ac4c-68ba67a9aa9a	d225a6fc-fa2d-462c-81f2-4eb151c93207	Edwin Figueroa	4	\N	2026-05-14 23:36:56.033361
eea13768-9d5a-4ba1-bac8-f3b198cab4c8	d225a6fc-fa2d-462c-81f2-4eb151c93207	Alexis Guerrero	5	\N	2026-05-14 23:36:56.546102
f0d56732-ba2a-43c5-9e20-3aeaaf24dd15	d225a6fc-fa2d-462c-81f2-4eb151c93207	Harold Soto	6	\N	2026-05-14 23:36:57.011694
4093019d-9112-4b83-8a53-5595aaf69a75	d225a6fc-fa2d-462c-81f2-4eb151c93207	Luis Molina	7	\N	2026-05-14 23:36:57.478461
dd3ccc37-2ce8-4bf9-99ef-e08a8a682d01	d225a6fc-fa2d-462c-81f2-4eb151c93207	Johnatan Acosta	8	\N	2026-05-14 23:36:57.942597
6f0dd486-c853-4206-883f-9403fe02f6dd	d225a6fc-fa2d-462c-81f2-4eb151c93207	Rodrigo Vega	9	\N	2026-05-14 23:36:58.423494
3f61b92c-bb97-4d83-abe1-48dd1cb89950	d225a6fc-fa2d-462c-81f2-4eb151c93207	Nelson Escobar	10	\N	2026-05-14 23:36:58.887398
ccc84499-a3b1-40dc-9712-c69a531e1fe2	f381b47c-ad99-4dfb-835b-3fb79a48b031	Javier Sandoval	2	\N	2026-05-14 23:36:59.852452
168c3e50-f6a2-4fc6-8bda-ed37ba22d12f	f381b47c-ad99-4dfb-835b-3fb79a48b031	Emanuel Arias	3	\N	2026-05-14 23:37:00.344401
e8578b45-4754-4a52-8a04-71500293d75f	f381b47c-ad99-4dfb-835b-3fb79a48b031	Brayan Cardona	4	\N	2026-05-14 23:37:00.823442
205981fd-efae-4361-b04d-b7112e839e51	f381b47c-ad99-4dfb-835b-3fb79a48b031	Sergio Alvarez	5	\N	2026-05-14 23:37:01.28504
e8b13d28-89b4-4760-a2f7-eb6fb4ed4b6c	f381b47c-ad99-4dfb-835b-3fb79a48b031	John Bedoya	7	\N	2026-05-14 23:37:02.216485
a2de215d-6655-4dde-b7bd-1b5b3546a230	f381b47c-ad99-4dfb-835b-3fb79a48b031	Anderson Osorio	8	\N	2026-05-14 23:37:02.725969
f27b0215-9126-4f12-983b-59d7ec9742ec	f381b47c-ad99-4dfb-835b-3fb79a48b031	Elias Zapata	9	\N	2026-05-14 23:37:03.192612
969afee3-46f0-40dd-8bfd-b9c49c3c0525	f381b47c-ad99-4dfb-835b-3fb79a48b031	Ferney Aguilar	10	\N	2026-05-14 23:37:03.662374
cb35a96e-8a2d-4e31-bd0d-4c36bf444b66	2760dc3c-963b-44af-b94a-105009e627e2	Rodrigo Villegas	1	\N	2026-05-14 23:37:04.136388
4917e821-e261-4761-b4f6-2bebeedccd93	2760dc3c-963b-44af-b94a-105009e627e2	Mario Naranjo	2	\N	2026-05-14 23:37:04.614173
94aea30e-7adb-4f4c-8754-26e59526a8b0	2760dc3c-963b-44af-b94a-105009e627e2	Hector Castillo	3	\N	2026-05-14 23:37:05.124982
105c8708-379e-41f3-92ea-c3233ebfeec4	2760dc3c-963b-44af-b94a-105009e627e2	Camilo Duarte	4	\N	2026-05-14 23:37:05.59127
4351b6cf-f550-4ad0-bc3d-4f85327cda96	2760dc3c-963b-44af-b94a-105009e627e2	Juan Quintero	7	\N	2026-05-14 23:37:07.073107
8953d6bd-caa6-4c55-97b9-a7b3c0d49d7d	2760dc3c-963b-44af-b94a-105009e627e2	Diego Arango	8	\N	2026-05-14 23:37:07.524964
22a64b6e-0d2f-4fa1-8433-46922cf63d61	2760dc3c-963b-44af-b94a-105009e627e2	Stiven Urrego	10	\N	2026-05-14 23:37:08.458578
ae287165-13d3-43d7-87e2-a43fa69dd960	b1672882-3c1e-4648-81da-e1f3f99f75ab	Jhonnier Mina	1	\N	2026-05-14 23:37:08.920806
f6a34ee1-0a51-4eb6-a5ca-66f5b0eb063f	b1672882-3c1e-4648-81da-e1f3f99f75ab	Yairo Moreno	2	\N	2026-05-14 23:37:09.419207
f431e8b3-bc0f-4737-80ab-0e5c60ffe6a9	b1672882-3c1e-4648-81da-e1f3f99f75ab	Darwin Machis	3	\N	2026-05-14 23:37:09.871364
778c3c81-82ae-4031-ae83-11f20bdbe553	b1672882-3c1e-4648-81da-e1f3f99f75ab	Radamel Falcao	4	\N	2026-05-14 23:37:10.384685
c9aae1db-08c0-4e94-9a26-57083492e5ec	b1672882-3c1e-4648-81da-e1f3f99f75ab	Cuadrado Salcedo	6	\N	2026-05-14 23:37:11.317165
342aa752-7527-4811-b9fc-1cbb81ef5fbe	b1672882-3c1e-4648-81da-e1f3f99f75ab	Carlos Bacca	7	\N	2026-05-14 23:37:11.798442
7aab22fd-2dad-43d0-9e18-a7bfb863d259	b1672882-3c1e-4648-81da-e1f3f99f75ab	Juan Cuadros	9	\N	2026-05-14 23:37:12.759371
5245538a-c836-4a9c-ad6f-be147e71968a	b1672882-3c1e-4648-81da-e1f3f99f75ab	Teo Valencia	10	\N	2026-05-14 23:37:13.260282
3773564a-87c7-41c6-90df-8ce9ed2331a6	069ab702-1a65-4474-8175-952c329cbe8a	Carlos Rodríguez	1	\N	2026-05-14 23:36:40.348147
314f0498-9905-4bb8-9f64-35974804e79a	069ab702-1a65-4474-8175-952c329cbe8a	Andrés Martínez	2	\N	2026-05-14 23:36:40.829544
a51c8292-146f-4090-99d7-a93bf514a63f	069ab702-1a65-4474-8175-952c329cbe8a	Felipe García	3	\N	2026-05-14 23:36:41.28019
7dc5ad65-4e98-40cc-a219-4c910073f27a	069ab702-1a65-4474-8175-952c329cbe8a	Juan Gómez	4	\N	2026-05-14 23:36:41.745364
d257f032-09e2-4d34-85fb-777ffac36001	069ab702-1a65-4474-8175-952c329cbe8a	Diego Hernández	5	\N	2026-05-14 23:36:42.199991
e3a0b268-86dc-45de-a3ec-96166eedfd70	069ab702-1a65-4474-8175-952c329cbe8a	Sebastián López	6	\N	2026-05-14 23:36:42.691221
2d8cab7a-3e48-495d-b7de-f0c45b242eb1	069ab702-1a65-4474-8175-952c329cbe8a	Nicolás Ramos	9	\N	2026-05-14 23:36:44.069827
ae5af24a-d5a0-417c-bcff-352571988bda	069ab702-1a65-4474-8175-952c329cbe8a	David Jiménez	10	\N	2026-05-14 23:36:44.548672
d9053b4e-3c9d-4edf-b01b-12727787030a	d225a6fc-fa2d-462c-81f2-4eb151c93207	Gustavo Núñez	1	\N	2026-05-14 23:36:54.59891
761da1af-7979-4b38-b240-682244ee7972	f381b47c-ad99-4dfb-835b-3fb79a48b031	Cristóbal Muñoz	1	\N	2026-05-14 23:36:59.356581
a3ef56c8-5879-4357-9241-79a80320f7b7	5e09ec6c-63a4-422f-83a8-c9b3f83bd84c	Kevin Díaz	1	\N	2026-05-14 23:36:49.755436
a42707f2-bf3b-4048-b700-9ed8628c9b8a	5e09ec6c-63a4-422f-83a8-c9b3f83bd84c	Jhon Peña	2	\N	2026-05-14 23:36:50.298112
b01f7160-8c39-4928-bff3-9ed652727129	b43d433f-9252-4ee0-98f0-97378f492fab	Julián Reyes	3	\N	2026-05-14 23:36:45.963233
f41c41d9-42df-4a49-adef-509bc0c4e39d	5e09ec6c-63a4-422f-83a8-c9b3f83bd84c	Iván Rios	4	\N	2026-05-14 23:36:51.270755
b8148a7d-3b1d-43f2-8dbb-ffc9cc14595b	2760dc3c-963b-44af-b94a-105009e627e2	Óscar Bermúdez	5	\N	2026-05-14 23:37:06.148229
a4d71b3a-0b16-4f9d-aee7-772ef4ef723c	b1672882-3c1e-4648-81da-e1f3f99f75ab	James Rodríguez	5	\N	2026-05-14 23:37:10.852376
65cb1f9f-5a5e-4c37-a92d-d1dbc7029754	f381b47c-ad99-4dfb-835b-3fb79a48b031	Mauricio Patiño	6	\N	2026-05-14 23:37:01.753899
ff235134-1f96-44ae-aa3e-ba71968c098b	2760dc3c-963b-44af-b94a-105009e627e2	Andrés Lozano	6	\N	2026-05-14 23:37:06.61058
fdb0cd0b-ec1d-44f6-9c59-00d39b70ebb0	b1672882-3c1e-4648-81da-e1f3f99f75ab	Teófilo Gutiérrez	8	\N	2026-05-14 23:37:12.251664
ff0fae9b-8280-4da5-a35c-0c7c51125ba9	5e09ec6c-63a4-422f-83a8-c9b3f83bd84c	Víctor Cano	8	\N	2026-05-14 23:36:53.158967
47f3a4e0-c3be-4019-af85-4f09376eb852	5e09ec6c-63a4-422f-83a8-c9b3f83bd84c	Walter Castaño	9	\N	2026-05-14 23:36:53.627056
99546a71-2786-4ce2-ace8-9f0b1fd3f20c	2760dc3c-963b-44af-b94a-105009e627e2	Felipe Cárdenas	9	\N	2026-05-14 23:37:07.988251
29a9556f-e589-41e8-a621-5b37a1abc6cd	b43d433f-9252-4ee0-98f0-97378f492fab	Fabio Suárez	9	\N	2026-05-14 23:36:48.757084
d9121114-9d15-4727-923e-4b8338369825	b43d433f-9252-4ee0-98f0-97378f492fab	Andrés Ruiz	10	\N	2026-05-14 23:36:49.218079
7a11b26a-c13b-40df-82bd-0a86fef85c33	99c066db-decf-42c2-b082-f012591a94f2	Unai Simon	1	\N	2026-05-28 04:10:46.802986
70aac508-a85e-499c-9427-0eeed7b5117e	99c066db-decf-42c2-b082-f012591a94f2	Santos	26	https://res.cloudinary.com/deihqamm8/image/upload/v1779941472/gol-manager/player-photos/uyjd13up2gdoiigbxovn.png	2026-05-28 04:11:13.780406
f3e55baa-34e9-4807-8105-7ef4dbdcaea2	0ee94e43-38bd-49f8-9d5d-356fae171426	Gerard Martín	18	https://res.cloudinary.com/deihqamm8/image/upload/v1779946545/gol-manager/player-photos/emmiehbwbtdelqajbtoy.png	2026-05-28 04:14:01.3522
6e0af902-7c4b-4049-a470-b84d1dd59104	0ee94e43-38bd-49f8-9d5d-356fae171426	Ronald Araujo	4	https://res.cloudinary.com/deihqamm8/image/upload/v1779946519/gol-manager/player-photos/ispbusgcb7ocm8u3li0d.png	2026-05-28 04:14:20.193031
ab8c8da4-d399-460a-8bfc-a49f0ab1d165	0ee94e43-38bd-49f8-9d5d-356fae171426	Pau Cubarsí	5	https://res.cloudinary.com/deihqamm8/image/upload/v1779946659/gol-manager/player-photos/a86peyh8qotv3jp9gjnm.png	2026-05-28 04:13:19.477702
09c37ffd-3c5e-4b74-ad52-4c56547ce3eb	0ee94e43-38bd-49f8-9d5d-356fae171426	Eric García	24	https://res.cloudinary.com/deihqamm8/image/upload/v1779946625/gol-manager/player-photos/akh4u7ve0gyszfrd5qdp.png	2026-05-28 04:13:39.638728
71078d4d-d386-4da1-a1ad-e695bd4c800c	0ee94e43-38bd-49f8-9d5d-356fae171426	Wojciech Szczesny	25	https://res.cloudinary.com/deihqamm8/image/upload/v1779946687/gol-manager/player-photos/ehfrxm6ai9dkom5pcasp.png	2026-05-28 04:12:56.227669
b395bcdf-7d58-499f-8787-bb499a20ded7	0ee94e43-38bd-49f8-9d5d-356fae171426	João Cancelo	2	https://res.cloudinary.com/deihqamm8/image/upload/v1779945571/gol-manager/player-photos/mk73giu3ipysc9kzoear.png	2026-05-28 04:14:44.640568
bc110983-a454-4580-9cef-fe222eaa6916	0ee94e43-38bd-49f8-9d5d-356fae171426	Pedri	8	https://res.cloudinary.com/deihqamm8/image/upload/v1779944461/gol-manager/player-photos/nyyk4rnayjqzk9tzubzd.png	2026-05-28 04:15:15.114899
268006e6-e164-442e-9355-1c757e370d23	0ee94e43-38bd-49f8-9d5d-356fae171426	Frenkie de Jong	21	https://res.cloudinary.com/deihqamm8/image/upload/v1779944218/gol-manager/player-photos/o44jd8web7cmwtxljjcv.png	2026-05-28 04:15:42.530117
82b6a3aa-ec76-438e-ab54-336abc12e7f4	0ee94e43-38bd-49f8-9d5d-356fae171426	Gavi	6	https://res.cloudinary.com/deihqamm8/image/upload/v1779944069/gol-manager/player-photos/ykxx5glmbd9paqu5dcuq.png	2026-05-28 04:15:57.81409
be1aa029-1588-4e26-83dc-a1dd2cac9603	0ee94e43-38bd-49f8-9d5d-356fae171426	Joan García	13	https://res.cloudinary.com/deihqamm8/image/upload/v1779944411/gol-manager/player-photos/xysxllqddpqotr7mwrbs.png	2026-05-28 04:12:36.729267
aaf087d3-c285-4748-a2a4-14e4f28db2bf	0ee94e43-38bd-49f8-9d5d-356fae171426	Ferran Torres	7	https://res.cloudinary.com/deihqamm8/image/upload/v1779944604/gol-manager/player-photos/flwdjbez9mnth8sl8lkd.png	2026-05-28 04:16:15.357428
c5e9855f-047f-463a-9b07-c93b7dda41e8	c80716ee-69dd-4c7e-a502-e6fd3d592596	Courtois	1	https://res.cloudinary.com/deihqamm8/image/upload/v1780022048/gol-manager/player-photos/m81b6wnveipolfxouiui.png	2026-05-29 02:34:14.193642
1c7dfe1d-65b8-4a6a-891e-fc0b955811ca	c80716ee-69dd-4c7e-a502-e6fd3d592596	Carvajal	2	https://res.cloudinary.com/deihqamm8/image/upload/v1780022090/gol-manager/player-photos/mliodnstxqnpqprng6dq.png	2026-05-29 02:35:00.114612
05022158-908f-4982-8e5b-16aba01dbbc4	c80716ee-69dd-4c7e-a502-e6fd3d592596	Bellingham	5	https://res.cloudinary.com/deihqamm8/image/upload/v1780022177/gol-manager/player-photos/tnokqko2f8d5apu0vlq2.png	2026-05-29 02:36:19.037436
99a1d37d-7e31-4c44-a09d-d703ba3b9e5d	c80716ee-69dd-4c7e-a502-e6fd3d592596	Camavinga	6	https://res.cloudinary.com/deihqamm8/image/upload/v1780022206/gol-manager/player-photos/rqetocb4r9mc2uma0w6v.png	2026-05-29 02:36:48.284969
0705c619-0542-4d6f-9c02-79fe2b11c26d	c80716ee-69dd-4c7e-a502-e6fd3d592596	Valverde	8	https://res.cloudinary.com/deihqamm8/image/upload/v1780022245/gol-manager/player-photos/r1cwvdcbhbqyqqoj5clg.png	2026-05-29 02:35:47.767132
ebefc596-3155-4fd4-b891-5c556291775b	0ee94e43-38bd-49f8-9d5d-356fae171426	Lamine Yamal	10	https://res.cloudinary.com/deihqamm8/image/upload/v1780022406/gol-manager/player-photos/vpkn7ddivasooxuuhpek.png	2026-05-29 02:40:08.015752
\.


--
-- Data for Name: team_balances; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.team_balances (id, team_id, tournament_id, balance, updated_at) FROM stdin;
6ef48607-9d21-47a1-80e7-43d808614faf	b1672882-3c1e-4648-81da-e1f3f99f75ab	d4b554e5-1def-4c95-9f13-f5acfe1576cc	10	2026-05-22 03:21:35.902136
015be8bd-8cf9-41b5-a5d8-ba40738338c1	b43d433f-9252-4ee0-98f0-97378f492fab	d4b554e5-1def-4c95-9f13-f5acfe1576cc	10	2026-05-22 03:22:02.573882
7a144621-ea89-4d41-bdb0-6f1ec9798d61	d225a6fc-fa2d-462c-81f2-4eb151c93207	d4b554e5-1def-4c95-9f13-f5acfe1576cc	10	2026-05-22 03:31:59.540782
6a302bf9-fbb3-4a0d-943f-676c96f75128	5e09ec6c-63a4-422f-83a8-c9b3f83bd84c	d4b554e5-1def-4c95-9f13-f5acfe1576cc	10	2026-05-22 03:33:13.070818
ebed2502-876c-4bb5-8193-378333082e84	f381b47c-ad99-4dfb-835b-3fb79a48b031	d4b554e5-1def-4c95-9f13-f5acfe1576cc	10	2026-05-28 03:47:54.879475
\.


--
-- Data for Name: teams; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.teams (id, tournament_id, name, logo_url, primary_color, secondary_color, delegate_id, created_at) FROM stdin;
b43d433f-9252-4ee0-98f0-97378f492fab	d4b554e5-1def-4c95-9f13-f5acfe1576cc	Clan Familiar	\N	\N	\N	\N	2026-05-14 23:33:45.751694
5e09ec6c-63a4-422f-83a8-c9b3f83bd84c	d4b554e5-1def-4c95-9f13-f5acfe1576cc	Los Angos	\N	\N	\N	\N	2026-05-14 23:33:51.954835
d225a6fc-fa2d-462c-81f2-4eb151c93207	d4b554e5-1def-4c95-9f13-f5acfe1576cc	Incognitos	\N	\N	\N	\N	2026-05-14 23:34:03.948816
f381b47c-ad99-4dfb-835b-3fb79a48b031	d4b554e5-1def-4c95-9f13-f5acfe1576cc	williwilli	\N	\N	\N	\N	2026-05-14 23:34:14.257799
2760dc3c-963b-44af-b94a-105009e627e2	d4b554e5-1def-4c95-9f13-f5acfe1576cc	prueba	\N	\N	\N	\N	2026-05-14 23:34:21.493148
b1672882-3c1e-4648-81da-e1f3f99f75ab	d4b554e5-1def-4c95-9f13-f5acfe1576cc	Barcelona	\N	\N	\N	\N	2026-05-14 23:34:26.828196
444e6269-c552-4b5b-8957-b0cad4c4b4a0	d4b554e5-1def-4c95-9f13-f5acfe1576cc	eys	https://res.cloudinary.com/deihqamm8/image/upload/v1779939772/gol-manager/team-logos/dag11fbqvnv6cqzqtohs.jpg	\N	\N	\N	2026-05-28 03:42:59.416548
069ab702-1a65-4474-8175-952c329cbe8a	d4b554e5-1def-4c95-9f13-f5acfe1576cc	Grupos sOCIAL	https://res.cloudinary.com/deihqamm8/image/upload/v1779940889/gol-manager/team-logos/gvol5ytwzyzljwvbj6me.jpg	#ff00dd	#ff0000	\N	2026-05-14 23:33:33.840204
99c066db-decf-42c2-b082-f012591a94f2	bcfe0450-bdf8-447c-93d3-b2cc041c702c	Athletic Club	https://res.cloudinary.com/deihqamm8/image/upload/v1779941197/gol-manager/team-logos/mhnrvzrt2owbkrcjch2v.png	\N	\N	\N	2026-05-28 04:06:42.11045
638396d8-95b7-422f-a0b9-e3b102a5525c	bcfe0450-bdf8-447c-93d3-b2cc041c702c	Club Atlético de Madrid SAD	https://res.cloudinary.com/deihqamm8/image/upload/v1779941223/gol-manager/team-logos/ohga0eazohibkcplkzni.png	\N	\N	\N	2026-05-28 04:07:05.898029
7f8027b1-e5cc-4d46-94d8-e90e9ad20b3b	bcfe0450-bdf8-447c-93d3-b2cc041c702c	Club Atlético Osasuna	https://res.cloudinary.com/deihqamm8/image/upload/v1779941256/gol-manager/team-logos/tatdj4yrlj7o82emtxyw.png	\N	\N	\N	2026-05-28 04:07:37.67396
3bab5ed5-2b23-4aa7-956b-105ad3bb4bff	bcfe0450-bdf8-447c-93d3-b2cc041c702c	Celta	https://res.cloudinary.com/deihqamm8/image/upload/v1779941279/gol-manager/team-logos/j3vjw24h0mqvaoa2inkg.png	\N	\N	\N	2026-05-28 04:08:00.49954
30182d15-4333-47e0-a34a-752b34d44976	bcfe0450-bdf8-447c-93d3-b2cc041c702c	Deportivo Alavés SAD	https://res.cloudinary.com/deihqamm8/image/upload/v1779941301/gol-manager/team-logos/igliv5ghb4zipsmvvhba.png	\N	\N	\N	2026-05-28 04:08:22.389746
29409f30-6b65-4184-9393-78927dc8875d	bcfe0450-bdf8-447c-93d3-b2cc041c702c	Elche Club de Fútbol SAD	https://res.cloudinary.com/deihqamm8/image/upload/v1779941322/gol-manager/team-logos/ognh7xd6kweregystad2.png	\N	\N	\N	2026-05-28 04:08:43.914564
0ee94e43-38bd-49f8-9d5d-356fae171426	bcfe0450-bdf8-447c-93d3-b2cc041c702c	Fútbol Club Barcelona	https://res.cloudinary.com/deihqamm8/image/upload/v1779941370/gol-manager/team-logos/b40zpauvw6wvxqblyklc.png	\N	\N	\N	2026-05-28 04:09:31.434604
4140ab37-754c-4cbb-809c-239ef9fedd28	bcfe0450-bdf8-447c-93d3-b2cc041c702c	Rayo Vallecano de Madrid SAD	https://res.cloudinary.com/deihqamm8/image/upload/v1779941395/gol-manager/team-logos/samp1nhqxdiqdtyjvzew.png	\N	\N	\N	2026-05-28 04:09:56.543804
c80716ee-69dd-4c7e-a502-e6fd3d592596	bcfe0450-bdf8-447c-93d3-b2cc041c702c	Real Madrid Club de Fútbol	https://res.cloudinary.com/deihqamm8/image/upload/v1779941416/gol-manager/team-logos/e8ae6a78mtcqa86kjcnm.png	\N	\N	\N	2026-05-28 04:10:17.834612
\.


--
-- Data for Name: tournament_rounds; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.tournament_rounds (id, tournament_id, stage, name, status, closed_at, closed_by_id, created_at) FROM stdin;
da302c5e-f2bb-4db8-8116-af31628f452f	d4b554e5-1def-4c95-9f13-f5acfe1576cc	1	\N	CLOSED	2026-05-22 04:16:55.843	\N	2026-05-22 04:16:55.805869
\.


--
-- Data for Name: tournaments; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.tournaments (id, name, slug, sport_type, format, half_duration_minutes, max_roster_size, category, status, created_at, yellow_card_fine, red_card_fine, late_fine, court_fee, referee_fee, referee_fee_enabled, logo_url, logo_bg_removed_url, league_id, yellows_for_suspension, red_card_suspension_matches) FROM stdin;
d4b554e5-1def-4c95-9f13-f5acfe1576cc	copa oso 	copa-oso-	FUTSAL	ROUND_ROBIN	25	20	\N	ACTIVE	2026-05-14 23:33:16.167027	0.5	1	1.5	0	10	t	\N	\N	00000000-0000-0000-0000-000000000001	2	1
5b98dd6f-f9a5-446d-a37f-3dae98ca94c6	Copa Interandina 	copa-interandina-	FUTSAL	ROUND_ROBIN	20	20	\N	DRAFT	2026-05-28 04:05:03.721265	0.5	1	1	10	0	f	\N	\N	00000000-0000-0000-0000-000000000001	2	1
bcfe0450-bdf8-447c-93d3-b2cc041c702c	Liga EA SPORTS	liga-ea-sports-	FOOTBALL	ROUND_ROBIN	45	20	\N	ACTIVE	2026-05-28 04:05:52.266656	0.5	1	1	0	12	t	https://res.cloudinary.com/deihqamm8/image/upload/v1779945308/gol-manager/tournament-logos/xvhnh3c8oz01ybmlxdil.jpg	https://res.cloudinary.com/deihqamm8/image/upload/v1779945308/gol-manager/tournament-logos-transparent/oiiuqyauxhzzqqgeygnv.png	00000000-0000-0000-0000-000000000001	2	1
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.users (id, email, password_hash, name, role, whatsapp_number, created_at, league_id) FROM stdin;
5acd47ab-64b9-4ebc-92dd-23e113cc49b9	admin@golmanager.com	$2b$10$RSSMsHcVB9V98TsrFYhm2ubMTka/JE8u1Trc.3UeYf9y3KgioWfSi	Administrador	SUPER_ADMIN	\N	2026-05-14 23:07:57.182843	00000000-0000-0000-0000-000000000001
ca6330da-13bd-4a26-9f06-905f7b376b9a	sebas@golmanager.com	$2b$10$7dDBA7yXZoruxRn6fOd7kOi95DpV7RBS2KEVWd0HL21oLbszgprze	Sebas	SUPER_ADMIN	\N	2026-05-19 01:22:19.378182	00000000-0000-0000-0000-000000000001
c04ee3f4-b80c-4e49-b302-071ba2e82b7c	vocal@sports.com	$2b$10$oWP9NdvpIkosUWZHD8RcC.BUmCEGz/pM54GMD1bhuZEEyB.KE83/e	Usuario Vocal	VOCAL	\N	2026-05-20 03:59:09.177933	00000000-0000-0000-0000-000000000001
98d5df0b-73eb-4125-9862-97e2fdf3fb11	admin@sports.com	$2b$10$SND42bHDM8DbpSJKhWHvY.YFMjt919AsqaqdsdmZqXrE5PfOfbqz.	Super Admin	SUPER_ADMIN	\N	2026-05-20 03:59:09.177933	00000000-0000-0000-0000-000000000001
\.


--
-- Name: __drizzle_migrations_id_seq; Type: SEQUENCE SET; Schema: drizzle; Owner: -
--

SELECT pg_catalog.setval('drizzle.__drizzle_migrations_id_seq', 6, true);


--
-- Name: __drizzle_migrations __drizzle_migrations_pkey; Type: CONSTRAINT; Schema: drizzle; Owner: -
--

ALTER TABLE ONLY drizzle.__drizzle_migrations
    ADD CONSTRAINT __drizzle_migrations_pkey PRIMARY KEY (id);


--
-- Name: balance_ledger balance_ledger_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.balance_ledger
    ADD CONSTRAINT balance_ledger_pkey PRIMARY KEY (id);


--
-- Name: fines fines_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.fines
    ADD CONSTRAINT fines_pkey PRIMARY KEY (id);


--
-- Name: leagues leagues_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.leagues
    ADD CONSTRAINT leagues_pkey PRIMARY KEY (id);


--
-- Name: match_events match_events_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.match_events
    ADD CONSTRAINT match_events_pkey PRIMARY KEY (id);


--
-- Name: matches matches_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.matches
    ADD CONSTRAINT matches_pkey PRIMARY KEY (id);


--
-- Name: payments payments_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.payments
    ADD CONSTRAINT payments_pkey PRIMARY KEY (id);


--
-- Name: player_suspensions player_suspensions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.player_suspensions
    ADD CONSTRAINT player_suspensions_pkey PRIMARY KEY (id);


--
-- Name: players players_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.players
    ADD CONSTRAINT players_pkey PRIMARY KEY (id);


--
-- Name: team_balances team_balances_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.team_balances
    ADD CONSTRAINT team_balances_pkey PRIMARY KEY (id);


--
-- Name: teams teams_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.teams
    ADD CONSTRAINT teams_pkey PRIMARY KEY (id);


--
-- Name: tournament_rounds tournament_rounds_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tournament_rounds
    ADD CONSTRAINT tournament_rounds_pkey PRIMARY KEY (id);


--
-- Name: tournaments tournaments_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tournaments
    ADD CONSTRAINT tournaments_pkey PRIMARY KEY (id);


--
-- Name: users users_email_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_unique UNIQUE (email);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: fines_cancelled_at_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX fines_cancelled_at_idx ON public.fines USING btree (cancelled_at) WHERE (cancelled_at IS NULL);


--
-- Name: leagues_slug_unique_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX leagues_slug_unique_idx ON public.leagues USING btree (slug);


--
-- Name: match_events_cancelled_at_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX match_events_cancelled_at_idx ON public.match_events USING btree (cancelled_at) WHERE (cancelled_at IS NULL);


--
-- Name: suspensions_player_tournament_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX suspensions_player_tournament_idx ON public.player_suspensions USING btree (player_id, tournament_id);


--
-- Name: suspensions_status_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX suspensions_status_idx ON public.player_suspensions USING btree (status);


--
-- Name: team_balances_team_tournament_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX team_balances_team_tournament_idx ON public.team_balances USING btree (team_id, tournament_id);


--
-- Name: tournament_rounds_tournament_stage_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX tournament_rounds_tournament_stage_idx ON public.tournament_rounds USING btree (tournament_id, stage);


--
-- Name: tournaments_league_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX tournaments_league_id_idx ON public.tournaments USING btree (league_id);


--
-- Name: tournaments_slug_league_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX tournaments_slug_league_idx ON public.tournaments USING btree (slug, league_id);


--
-- Name: users_league_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX users_league_id_idx ON public.users USING btree (league_id);


--
-- Name: balance_ledger balance_ledger_fine_id_fines_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.balance_ledger
    ADD CONSTRAINT balance_ledger_fine_id_fines_id_fk FOREIGN KEY (fine_id) REFERENCES public.fines(id);


--
-- Name: balance_ledger balance_ledger_match_id_matches_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.balance_ledger
    ADD CONSTRAINT balance_ledger_match_id_matches_id_fk FOREIGN KEY (match_id) REFERENCES public.matches(id);


--
-- Name: balance_ledger balance_ledger_payment_id_payments_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.balance_ledger
    ADD CONSTRAINT balance_ledger_payment_id_payments_id_fk FOREIGN KEY (payment_id) REFERENCES public.payments(id);


--
-- Name: balance_ledger balance_ledger_team_id_teams_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.balance_ledger
    ADD CONSTRAINT balance_ledger_team_id_teams_id_fk FOREIGN KEY (team_id) REFERENCES public.teams(id);


--
-- Name: balance_ledger balance_ledger_tournament_id_tournaments_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.balance_ledger
    ADD CONSTRAINT balance_ledger_tournament_id_tournaments_id_fk FOREIGN KEY (tournament_id) REFERENCES public.tournaments(id);


--
-- Name: fines fines_match_event_id_match_events_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.fines
    ADD CONSTRAINT fines_match_event_id_match_events_id_fk FOREIGN KEY (match_event_id) REFERENCES public.match_events(id);


--
-- Name: fines fines_match_id_matches_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.fines
    ADD CONSTRAINT fines_match_id_matches_id_fk FOREIGN KEY (match_id) REFERENCES public.matches(id);


--
-- Name: fines fines_team_id_teams_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.fines
    ADD CONSTRAINT fines_team_id_teams_id_fk FOREIGN KEY (team_id) REFERENCES public.teams(id);


--
-- Name: fines fines_tournament_id_tournaments_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.fines
    ADD CONSTRAINT fines_tournament_id_tournaments_id_fk FOREIGN KEY (tournament_id) REFERENCES public.tournaments(id);


--
-- Name: match_events match_events_cancelled_by_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.match_events
    ADD CONSTRAINT match_events_cancelled_by_id_fkey FOREIGN KEY (cancelled_by_id) REFERENCES public.users(id);


--
-- Name: match_events match_events_match_id_matches_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.match_events
    ADD CONSTRAINT match_events_match_id_matches_id_fk FOREIGN KEY (match_id) REFERENCES public.matches(id);


--
-- Name: match_events match_events_player_id_players_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.match_events
    ADD CONSTRAINT match_events_player_id_players_id_fk FOREIGN KEY (player_id) REFERENCES public.players(id);


--
-- Name: match_events match_events_player_out_id_players_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.match_events
    ADD CONSTRAINT match_events_player_out_id_players_id_fk FOREIGN KEY (player_out_id) REFERENCES public.players(id);


--
-- Name: match_events match_events_team_id_teams_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.match_events
    ADD CONSTRAINT match_events_team_id_teams_id_fk FOREIGN KEY (team_id) REFERENCES public.teams(id);


--
-- Name: matches matches_away_team_id_teams_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.matches
    ADD CONSTRAINT matches_away_team_id_teams_id_fk FOREIGN KEY (away_team_id) REFERENCES public.teams(id);


--
-- Name: matches matches_home_team_id_teams_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.matches
    ADD CONSTRAINT matches_home_team_id_teams_id_fk FOREIGN KEY (home_team_id) REFERENCES public.teams(id);


--
-- Name: matches matches_tournament_id_tournaments_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.matches
    ADD CONSTRAINT matches_tournament_id_tournaments_id_fk FOREIGN KEY (tournament_id) REFERENCES public.tournaments(id);


--
-- Name: matches matches_vocal_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.matches
    ADD CONSTRAINT matches_vocal_id_users_id_fk FOREIGN KEY (vocal_id) REFERENCES public.users(id);


--
-- Name: payments payments_fine_id_fines_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.payments
    ADD CONSTRAINT payments_fine_id_fines_id_fk FOREIGN KEY (fine_id) REFERENCES public.fines(id);


--
-- Name: payments payments_match_id_matches_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.payments
    ADD CONSTRAINT payments_match_id_matches_id_fk FOREIGN KEY (match_id) REFERENCES public.matches(id);


--
-- Name: payments payments_reviewed_by_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.payments
    ADD CONSTRAINT payments_reviewed_by_users_id_fk FOREIGN KEY (reviewed_by) REFERENCES public.users(id);


--
-- Name: payments payments_team_id_teams_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.payments
    ADD CONSTRAINT payments_team_id_teams_id_fk FOREIGN KEY (team_id) REFERENCES public.teams(id);


--
-- Name: payments payments_tournament_id_tournaments_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.payments
    ADD CONSTRAINT payments_tournament_id_tournaments_id_fk FOREIGN KEY (tournament_id) REFERENCES public.tournaments(id);


--
-- Name: player_suspensions player_suspensions_player_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.player_suspensions
    ADD CONSTRAINT player_suspensions_player_id_fkey FOREIGN KEY (player_id) REFERENCES public.players(id);


--
-- Name: player_suspensions player_suspensions_tournament_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.player_suspensions
    ADD CONSTRAINT player_suspensions_tournament_id_fkey FOREIGN KEY (tournament_id) REFERENCES public.tournaments(id);


--
-- Name: player_suspensions player_suspensions_triggered_by_event_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.player_suspensions
    ADD CONSTRAINT player_suspensions_triggered_by_event_id_fkey FOREIGN KEY (triggered_by_event_id) REFERENCES public.match_events(id);


--
-- Name: player_suspensions player_suspensions_triggered_by_match_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.player_suspensions
    ADD CONSTRAINT player_suspensions_triggered_by_match_id_fkey FOREIGN KEY (triggered_by_match_id) REFERENCES public.matches(id);


--
-- Name: players players_team_id_teams_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.players
    ADD CONSTRAINT players_team_id_teams_id_fk FOREIGN KEY (team_id) REFERENCES public.teams(id);


--
-- Name: team_balances team_balances_team_id_teams_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.team_balances
    ADD CONSTRAINT team_balances_team_id_teams_id_fk FOREIGN KEY (team_id) REFERENCES public.teams(id);


--
-- Name: team_balances team_balances_tournament_id_tournaments_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.team_balances
    ADD CONSTRAINT team_balances_tournament_id_tournaments_id_fk FOREIGN KEY (tournament_id) REFERENCES public.tournaments(id);


--
-- Name: teams teams_delegate_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.teams
    ADD CONSTRAINT teams_delegate_id_users_id_fk FOREIGN KEY (delegate_id) REFERENCES public.users(id);


--
-- Name: teams teams_tournament_id_tournaments_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.teams
    ADD CONSTRAINT teams_tournament_id_tournaments_id_fk FOREIGN KEY (tournament_id) REFERENCES public.tournaments(id);


--
-- Name: tournament_rounds tournament_rounds_closed_by_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tournament_rounds
    ADD CONSTRAINT tournament_rounds_closed_by_id_users_id_fk FOREIGN KEY (closed_by_id) REFERENCES public.users(id);


--
-- Name: tournament_rounds tournament_rounds_tournament_id_tournaments_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tournament_rounds
    ADD CONSTRAINT tournament_rounds_tournament_id_tournaments_id_fk FOREIGN KEY (tournament_id) REFERENCES public.tournaments(id) ON DELETE CASCADE;


--
-- Name: tournaments tournaments_league_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tournaments
    ADD CONSTRAINT tournaments_league_id_fk FOREIGN KEY (league_id) REFERENCES public.leagues(id) ON DELETE RESTRICT;


--
-- Name: users users_league_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_league_id_fk FOREIGN KEY (league_id) REFERENCES public.leagues(id) ON DELETE SET NULL;


--
-- PostgreSQL database dump complete
--

\unrestrict 6YJEoJjaesbG87VWFhNaF5eaf2h8m4BCqMxSbkMEkgiZQZaR7S8YF7EzAlKaTg2

