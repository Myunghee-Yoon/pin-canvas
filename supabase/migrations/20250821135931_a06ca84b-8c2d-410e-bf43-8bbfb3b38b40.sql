-- Create user profiles table
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  email TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create canvases table
CREATE TABLE public.canvases (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  image_url TEXT,
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create canvas_shares table for sharing permissions
CREATE TABLE public.canvas_shares (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  canvas_id UUID NOT NULL REFERENCES public.canvases(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  permission TEXT NOT NULL CHECK (permission IN ('editor', 'viewer')),
  shared_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(canvas_id, user_id)
);

-- Create layers table
CREATE TABLE public.layers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  canvas_id UUID NOT NULL REFERENCES public.canvases(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  color TEXT NOT NULL DEFAULT '#3B82F6',
  visible BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create pins table
CREATE TABLE public.pins (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  canvas_id UUID NOT NULL REFERENCES public.canvases(id) ON DELETE CASCADE,
  layer_id UUID NOT NULL REFERENCES public.layers(id) ON DELETE CASCADE,
  x FLOAT NOT NULL,
  y FLOAT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create media_items table for pin attachments
CREATE TABLE public.media_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  pin_id UUID NOT NULL REFERENCES public.pins(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('image', 'video')),
  url TEXT NOT NULL,
  name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.canvases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.canvas_shares ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.layers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pins ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.media_items ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profiles
CREATE POLICY "Users can view all profiles" ON public.profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own profile" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- RLS Policies for canvases
CREATE POLICY "Users can view their own canvases" ON public.canvases FOR SELECT TO authenticated USING (
  auth.uid() = owner_id OR 
  auth.uid() IN (
    SELECT user_id FROM public.canvas_shares 
    WHERE canvas_id = canvases.id
  )
);
CREATE POLICY "Users can create their own canvases" ON public.canvases FOR INSERT TO authenticated WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "Canvas owners can update their canvases" ON public.canvases FOR UPDATE TO authenticated USING (auth.uid() = owner_id);
CREATE POLICY "Canvas owners can delete their canvases" ON public.canvases FOR DELETE TO authenticated USING (auth.uid() = owner_id);

-- RLS Policies for canvas_shares
CREATE POLICY "Users can view shares for their canvases" ON public.canvas_shares FOR SELECT TO authenticated USING (
  auth.uid() IN (
    SELECT owner_id FROM public.canvases WHERE id = canvas_id
  ) OR auth.uid() = user_id
);
CREATE POLICY "Canvas owners can create shares" ON public.canvas_shares FOR INSERT TO authenticated WITH CHECK (
  auth.uid() IN (
    SELECT owner_id FROM public.canvases WHERE id = canvas_id
  ) AND auth.uid() = shared_by
);
CREATE POLICY "Canvas owners can update shares" ON public.canvas_shares FOR UPDATE TO authenticated USING (
  auth.uid() IN (
    SELECT owner_id FROM public.canvases WHERE id = canvas_id
  )
);
CREATE POLICY "Canvas owners can delete shares" ON public.canvas_shares FOR DELETE TO authenticated USING (
  auth.uid() IN (
    SELECT owner_id FROM public.canvases WHERE id = canvas_id
  )
);

-- RLS Policies for layers
CREATE POLICY "Users can view layers for accessible canvases" ON public.layers FOR SELECT TO authenticated USING (
  auth.uid() IN (
    SELECT owner_id FROM public.canvases WHERE id = canvas_id
  ) OR auth.uid() IN (
    SELECT user_id FROM public.canvas_shares WHERE canvas_id = layers.canvas_id
  )
);
CREATE POLICY "Canvas owners and editors can create layers" ON public.layers FOR INSERT TO authenticated WITH CHECK (
  auth.uid() IN (
    SELECT owner_id FROM public.canvases WHERE id = canvas_id
  ) OR auth.uid() IN (
    SELECT user_id FROM public.canvas_shares 
    WHERE canvas_id = layers.canvas_id AND permission = 'editor'
  )
);
CREATE POLICY "Canvas owners and editors can update layers" ON public.layers FOR UPDATE TO authenticated USING (
  auth.uid() IN (
    SELECT owner_id FROM public.canvases WHERE id = canvas_id
  ) OR auth.uid() IN (
    SELECT user_id FROM public.canvas_shares 
    WHERE canvas_id = layers.canvas_id AND permission = 'editor'
  )
);
CREATE POLICY "Canvas owners and editors can delete layers" ON public.layers FOR DELETE TO authenticated USING (
  auth.uid() IN (
    SELECT owner_id FROM public.canvases WHERE id = canvas_id
  ) OR auth.uid() IN (
    SELECT user_id FROM public.canvas_shares 
    WHERE canvas_id = layers.canvas_id AND permission = 'editor'
  )
);

-- RLS Policies for pins
CREATE POLICY "Users can view pins for accessible canvases" ON public.pins FOR SELECT TO authenticated USING (
  auth.uid() IN (
    SELECT owner_id FROM public.canvases WHERE id = canvas_id
  ) OR auth.uid() IN (
    SELECT user_id FROM public.canvas_shares WHERE canvas_id = pins.canvas_id
  )
);
CREATE POLICY "Canvas owners and editors can create pins" ON public.pins FOR INSERT TO authenticated WITH CHECK (
  (auth.uid() IN (
    SELECT owner_id FROM public.canvases WHERE id = canvas_id
  ) OR auth.uid() IN (
    SELECT user_id FROM public.canvas_shares 
    WHERE canvas_id = pins.canvas_id AND permission = 'editor'
  )) AND auth.uid() = created_by
);
CREATE POLICY "Canvas owners and editors can update pins" ON public.pins FOR UPDATE TO authenticated USING (
  auth.uid() IN (
    SELECT owner_id FROM public.canvases WHERE id = canvas_id
  ) OR auth.uid() IN (
    SELECT user_id FROM public.canvas_shares 
    WHERE canvas_id = pins.canvas_id AND permission = 'editor'
  )
);
CREATE POLICY "Canvas owners and editors can delete pins" ON public.pins FOR DELETE TO authenticated USING (
  auth.uid() IN (
    SELECT owner_id FROM public.canvases WHERE id = canvas_id
  ) OR auth.uid() IN (
    SELECT user_id FROM public.canvas_shares 
    WHERE canvas_id = pins.canvas_id AND permission = 'editor'
  )
);

-- RLS Policies for media_items
CREATE POLICY "Users can view media for accessible pins" ON public.media_items FOR SELECT TO authenticated USING (
  pin_id IN (
    SELECT p.id FROM public.pins p
    JOIN public.canvases c ON p.canvas_id = c.id
    WHERE c.owner_id = auth.uid() OR auth.uid() IN (
      SELECT user_id FROM public.canvas_shares WHERE canvas_id = p.canvas_id
    )
  )
);
CREATE POLICY "Canvas owners and editors can create media" ON public.media_items FOR INSERT TO authenticated WITH CHECK (
  pin_id IN (
    SELECT p.id FROM public.pins p
    JOIN public.canvases c ON p.canvas_id = c.id
    WHERE c.owner_id = auth.uid() OR auth.uid() IN (
      SELECT user_id FROM public.canvas_shares 
      WHERE canvas_id = p.canvas_id AND permission = 'editor'
    )
  )
);
CREATE POLICY "Canvas owners and editors can update media" ON public.media_items FOR UPDATE TO authenticated USING (
  pin_id IN (
    SELECT p.id FROM public.pins p
    JOIN public.canvases c ON p.canvas_id = c.id
    WHERE c.owner_id = auth.uid() OR auth.uid() IN (
      SELECT user_id FROM public.canvas_shares 
      WHERE canvas_id = p.canvas_id AND permission = 'editor'
    )
  )
);
CREATE POLICY "Canvas owners and editors can delete media" ON public.media_items FOR DELETE TO authenticated USING (
  pin_id IN (
    SELECT p.id FROM public.pins p
    JOIN public.canvases c ON p.canvas_id = c.id
    WHERE c.owner_id = auth.uid() OR auth.uid() IN (
      SELECT user_id FROM public.canvas_shares 
      WHERE canvas_id = p.canvas_id AND permission = 'editor'
    )
  )
);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_canvases_updated_at
  BEFORE UPDATE ON public.canvases
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_layers_updated_at
  BEFORE UPDATE ON public.layers
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_pins_updated_at
  BEFORE UPDATE ON public.pins
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to automatically create user profile
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, display_name, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)),
    NEW.email
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for automatic profile creation
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();