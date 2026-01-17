-- Family Tree Database Schema
-- Run this in your Supabase SQL Editor

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Profiles table (extends auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Family trees (one per user)
CREATE TABLE IF NOT EXISTS public.family_trees (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  name TEXT DEFAULT 'My Family Tree' NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  UNIQUE(user_id) -- Each user can only have one tree
);

-- Family members (leaves)
CREATE TABLE IF NOT EXISTS public.family_members (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  tree_id UUID REFERENCES public.family_trees(id) ON DELETE CASCADE NOT NULL,
  first_name TEXT NOT NULL,
  middle_name TEXT,
  last_name TEXT NOT NULL,
  photo_url TEXT,
  birth_date DATE,
  death_date DATE,
  bio TEXT,
  hobbies TEXT[] DEFAULT '{}',
  interests TEXT[] DEFAULT '{}',
  likes TEXT[] DEFAULT '{}',
  position_x FLOAT DEFAULT 0 NOT NULL,
  position_y FLOAT DEFAULT 0 NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Relationships between family members
CREATE TABLE IF NOT EXISTS public.family_relationships (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  tree_id UUID REFERENCES public.family_trees(id) ON DELETE CASCADE NOT NULL,
  member_id UUID REFERENCES public.family_members(id) ON DELETE CASCADE NOT NULL,
  related_member_id UUID REFERENCES public.family_members(id) ON DELETE CASCADE NOT NULL,
  relationship_type TEXT NOT NULL CHECK (relationship_type IN ('parent', 'child', 'spouse', 'sibling')),
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  UNIQUE(member_id, related_member_id)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_family_trees_user_id ON public.family_trees(user_id);
CREATE INDEX IF NOT EXISTS idx_family_members_tree_id ON public.family_members(tree_id);
CREATE INDEX IF NOT EXISTS idx_family_relationships_tree_id ON public.family_relationships(tree_id);
CREATE INDEX IF NOT EXISTS idx_family_relationships_member_id ON public.family_relationships(member_id);

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.family_trees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.family_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.family_relationships ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view their own profile" 
  ON public.profiles FOR SELECT 
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" 
  ON public.profiles FOR UPDATE 
  USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile" 
  ON public.profiles FOR INSERT 
  WITH CHECK (auth.uid() = id);

-- Family trees policies
CREATE POLICY "Users can view their own tree" 
  ON public.family_trees FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own tree" 
  ON public.family_trees FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own tree" 
  ON public.family_trees FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own tree" 
  ON public.family_trees FOR DELETE 
  USING (auth.uid() = user_id);

-- Family members policies
CREATE POLICY "Users can view their own members" 
  ON public.family_members FOR SELECT 
  USING (tree_id IN (SELECT id FROM public.family_trees WHERE user_id = auth.uid()));

CREATE POLICY "Users can create members in their tree" 
  ON public.family_members FOR INSERT 
  WITH CHECK (tree_id IN (SELECT id FROM public.family_trees WHERE user_id = auth.uid()));

CREATE POLICY "Users can update members in their tree" 
  ON public.family_members FOR UPDATE 
  USING (tree_id IN (SELECT id FROM public.family_trees WHERE user_id = auth.uid()));

CREATE POLICY "Users can delete members in their tree" 
  ON public.family_members FOR DELETE 
  USING (tree_id IN (SELECT id FROM public.family_trees WHERE user_id = auth.uid()));

-- Family relationships policies
CREATE POLICY "Users can view their own relationships" 
  ON public.family_relationships FOR SELECT 
  USING (tree_id IN (SELECT id FROM public.family_trees WHERE user_id = auth.uid()));

CREATE POLICY "Users can create relationships in their tree" 
  ON public.family_relationships FOR INSERT 
  WITH CHECK (tree_id IN (SELECT id FROM public.family_trees WHERE user_id = auth.uid()));

CREATE POLICY "Users can update relationships in their tree" 
  ON public.family_relationships FOR UPDATE 
  USING (tree_id IN (SELECT id FROM public.family_trees WHERE user_id = auth.uid()));

CREATE POLICY "Users can delete relationships in their tree" 
  ON public.family_relationships FOR DELETE 
  USING (tree_id IN (SELECT id FROM public.family_trees WHERE user_id = auth.uid()));

-- Function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'full_name');
  
  -- Also create a default family tree for the user
  INSERT INTO public.family_trees (user_id, name)
  VALUES (NEW.id, 'My Family Tree');
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create profile and tree on signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER family_trees_updated_at
  BEFORE UPDATE ON public.family_trees
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER family_members_updated_at
  BEFORE UPDATE ON public.family_members
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Storage bucket for avatars and member photos
-- Run this separately in Storage section or via API:
-- INSERT INTO storage.buckets (id, name, public) VALUES ('avatars', 'avatars', true);

-- Storage policies (run after creating bucket)
-- CREATE POLICY "Avatar images are publicly accessible" ON storage.objects FOR SELECT USING (bucket_id = 'avatars');
-- CREATE POLICY "Users can upload avatar" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'avatars' AND auth.role() = 'authenticated');
-- CREATE POLICY "Users can update their own avatar" ON storage.objects FOR UPDATE USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);
-- CREATE POLICY "Users can delete their own avatar" ON storage.objects FOR DELETE USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);
