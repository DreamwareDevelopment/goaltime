DROP TRIGGER IF EXISTS google_auth_trigger ON public.google_auth;
CREATE TRIGGER google_auth_trigger
AFTER INSERT ON public.google_auth
FOR EACH ROW
EXECUTE FUNCTION public.call_edge_function_from_trigger('calendar-initial-downsync');
