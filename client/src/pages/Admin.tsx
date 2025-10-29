import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Edit, Trash2, Check, X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function Admin() {
  const { user, isAdmin, isLoading } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [showTourDialog, setShowTourDialog] = useState(false);
  const [editingTour, setEditingTour] = useState<any>(null);
  const [tourForm, setTourForm] = useState({
    title: "",
    description: "",
    location: "",
    price: "",
    duration: "",
    maxPassengers: "",
    images: [] as string[],
  });

  const { data: tours } = useQuery<any[]>({ queryKey: ["/api/tours"] });
  const { data: reservations } = useQuery<any[]>({ queryKey: ["/api/reservations"] });

  useEffect(() => {
    if (!isLoading && (!user || !isAdmin)) {
      setLocation("/");
    }
  }, [isLoading, user, isAdmin, setLocation]);

  if (isLoading || (!user || !isAdmin)) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>{isLoading ? "Loading..." : "Redirecting..."}</p>
      </div>
    );
  }

  const handleImageUrlAdd = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      const input = e.currentTarget;
      const url = input.value.trim();
      if (url) {
        setTourForm(prev => ({
          ...prev,
          images: [...prev.images, url],
        }));
        input.value = "";
        toast({
          title: "Success",
          description: "Image URL added successfully",
        });
      }
    }
  };

  const handleSaveTour = async () => {
    try {
      const tourData = {
        ...tourForm,
        price: parseFloat(tourForm.price),
        maxPassengers: parseInt(tourForm.maxPassengers),
      };

      if (editingTour) {
        await apiRequest("PUT", `/api/tours/${editingTour.id}`, tourData);
        toast({ title: "Success", description: "Tour updated successfully" });
      } else {
        await apiRequest("POST", "/api/tours", tourData);
        toast({ title: "Success", description: "Tour created successfully" });
      }

      queryClient.invalidateQueries({ queryKey: ["/api/tours"] });
      setShowTourDialog(false);
      resetTourForm();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleDeleteTour = async (id: string) => {
    if (!confirm("Are you sure you want to delete this tour?")) return;
    try {
      await apiRequest("DELETE", `/api/tours/${id}`);
      queryClient.invalidateQueries({ queryKey: ["/api/tours"] });
      toast({ title: "Success", description: "Tour deleted successfully" });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const resetTourForm = () => {
    setTourForm({
      title: "",
      description: "",
      location: "",
      price: "",
      duration: "",
      maxPassengers: "",
      images: [],
    });
    setEditingTour(null);
  };

  const handleEditTour = (tour: any) => {
    setEditingTour(tour);
    setTourForm({
      title: tour.title,
      description: tour.description,
      location: tour.location,
      price: tour.price,
      duration: tour.duration,
      maxPassengers: tour.maxPassengers.toString(),
      images: tour.images || [],
    });
    setShowTourDialog(true);
  };

  const handleConfirmPayment = async (reservationId: string) => {
    try {
      await apiRequest("PUT", `/api/reservations/${reservationId}/status`, {
        status: "confirmed",
        paymentStatus: "completed",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/reservations"] });
      toast({
        title: "Success",
        description: "Payment confirmed successfully",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleUpdateReservationStatus = async (
    reservationId: string,
    status: string
  ) => {
    try {
      await apiRequest("PUT", `/api/reservations/${reservationId}/status`, {
        status,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/reservations"] });
      toast({
        title: "Success",
        description: `Reservation status updated to ${status}`,
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-muted/30 p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold mb-8">Admin Dashboard</h1>

        <Tabs defaultValue="tours" className="space-y-6">
          <TabsList>
            <TabsTrigger value="tours">Tours</TabsTrigger>
            <TabsTrigger value="reservations">Reservations</TabsTrigger>
          </TabsList>

          <TabsContent value="tours">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Tour Management</CardTitle>
                <Button
                  onClick={() => {
                    resetTourForm();
                    setShowTourDialog(true);
                  }}
                  data-testid="button-add-tour"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Tour
                </Button>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {tours?.map((tour: any) => (
                    <div
                      key={tour.id}
                      className="flex items-center justify-between p-4 border rounded-lg"
                      data-testid={`tour-item-${tour.id}`}
                    >
                      <div>
                        <h3 className="font-semibold">{tour.title}</h3>
                        <p className="text-sm text-muted-foreground">{tour.location}</p>
                        <p className="text-sm">${tour.price} - {tour.duration}</p>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => handleEditTour(tour)}
                          data-testid={`button-edit-${tour.id}`}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => handleDeleteTour(tour.id)}
                          data-testid={`button-delete-${tour.id}`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="reservations">
            <Card>
              <CardHeader>
                <CardTitle>Reservation Management</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {reservations?.map((reservation: any) => (
                    <div
                      key={reservation.id}
                      className="p-4 border rounded-lg"
                      data-testid={`reservation-item-${reservation.id}`}
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-semibold">Reservation #{reservation.id.slice(0, 8)}</p>
                          <p className="text-sm text-muted-foreground">
                            Status: {reservation.status} | Payment: {reservation.paymentStatus}
                          </p>
                          <p className="text-sm">Total: ${reservation.totalPrice}</p>
                        </div>
                        {reservation.paymentStatus === "pending" && (
                          <Button
                            size="sm"
                            onClick={() => handleConfirmPayment(reservation.id)}
                            data-testid={`button-confirm-payment-${reservation.id}`}
                          >
                            <Check className="h-4 w-4 mr-2" />
                            Confirm Payment
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <Dialog open={showTourDialog} onOpenChange={setShowTourDialog}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingTour ? "Edit Tour" : "Create New Tour"}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Title</Label>
                <Input
                  value={tourForm.title}
                  onChange={(e) => setTourForm(prev => ({ ...prev, title: e.target.value }))}
                  data-testid="input-tour-title"
                />
              </div>
              <div>
                <Label>Description</Label>
                <Textarea
                  value={tourForm.description}
                  onChange={(e) => setTourForm(prev => ({ ...prev, description: e.target.value }))}
                  data-testid="input-tour-description"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Location</Label>
                  <Input
                    value={tourForm.location}
                    onChange={(e) => setTourForm(prev => ({ ...prev, location: e.target.value }))}
                    data-testid="input-tour-location"
                  />
                </div>
                <div>
                  <Label>Price</Label>
                  <Input
                    type="number"
                    value={tourForm.price}
                    onChange={(e) => setTourForm(prev => ({ ...prev, price: e.target.value }))}
                    data-testid="input-tour-price"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Duration</Label>
                  <Input
                    value={tourForm.duration}
                    onChange={(e) => setTourForm(prev => ({ ...prev, duration: e.target.value }))}
                    placeholder="e.g., 3 days"
                    data-testid="input-tour-duration"
                  />
                </div>
                <div>
                  <Label>Max Passengers</Label>
                  <Input
                    type="number"
                    value={tourForm.maxPassengers}
                    onChange={(e) => setTourForm(prev => ({ ...prev, maxPassengers: e.target.value }))}
                    data-testid="input-tour-max-passengers"
                  />
                </div>
              </div>
              <div>
                <Label>Images (Enter image URLs)</Label>
                <Input
                  placeholder="Paste image URL and press Enter"
                  onKeyDown={handleImageUrlAdd}
                  data-testid="input-tour-image-url"
                />
                {tourForm.images.length > 0 && (
                  <div className="mt-2">
                    <p className="text-sm text-muted-foreground mb-2">
                      {tourForm.images.length} image(s) added:
                    </p>
                    <div className="space-y-1">
                      {tourForm.images.map((img, idx) => (
                        <div key={idx} className="flex items-center gap-2 text-xs">
                          <span className="flex-1 truncate">{img}</span>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            onClick={() => {
                              setTourForm(prev => ({
                                ...prev,
                                images: prev.images.filter((_, i) => i !== idx),
                              }));
                            }}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => setShowTourDialog(false)}>
                  Cancel
                </Button>
                <Button onClick={handleSaveTour} data-testid="button-save-tour">
                  {editingTour ? "Update" : "Create"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
