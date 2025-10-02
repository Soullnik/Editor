import { useState } from "react";
import { ISPSParticleAnimation } from "../../types";
import { Button } from "../../../../../ui/shadcn/ui/button";
import { Input } from "../../../../../ui/shadcn/ui/input";
import { Label } from "../../../../../ui/shadcn/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../../../../ui/shadcn/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "../../../../../ui/shadcn/ui/dialog";

export async function showAddSPSTrackPrompt(): Promise<ISPSParticleAnimation | null> {
	return new Promise((resolve) => {
		const dialog = document.createElement("div");
		document.body.appendChild(dialog);

		const AddTrackDialog = () => {
			const [property, setProperty] = useState<"position" | "rotation" | "scaling" | "color" | "visibility">("scaling");
			const [component, setComponent] = useState<"x" | "y" | "z" | "r" | "g" | "b" | "a">("x");
			const [name, setName] = useState("");
			const [open, setOpen] = useState(true);

			const handleSubmit = () => {
				const animation: ISPSParticleAnimation = {
					id: `animation_${Date.now()}`,
					name: name || `${property}.${component}`,
					property,
					component,
					enabled: true,
					keyframes: [
						{ time: 0.0, value: 0, easing: "linear" },
						{ time: 1.0, value: 1, easing: "linear" },
					],
					loop: false,
					randomize: false,
					randomRange: 0,
				};

				setOpen(false);
				resolve(animation);
			};

			const handleCancel = () => {
				setOpen(false);
				resolve(null);
			};

			const getAvailableComponents = (prop: "position" | "rotation" | "scaling" | "color" | "visibility"): ("x" | "y" | "z" | "r" | "g" | "b" | "a")[] => {
				switch (prop) {
					case "position":
					case "rotation":
					case "scaling":
						return ["x", "y", "z"];
					case "color":
						return ["r", "g", "b", "a"];
					case "visibility":
						return ["x"]; // Use x component for visibility (0-1)
					default:
						return ["x"];
				}
			};

			return (
				<Dialog open={open} onOpenChange={setOpen}>
					<DialogContent className="sm:max-w-[425px]">
						<DialogHeader>
							<DialogTitle>Add Animation Track</DialogTitle>
						</DialogHeader>

						<div className="grid gap-4 py-4">
							<div className="grid grid-cols-4 items-center gap-4">
								<Label htmlFor="name" className="text-right">
									Name
								</Label>
								<Input id="name" value={name} onChange={(e) => setName(e.target.value)} className="col-span-3" placeholder="Track name" />
							</div>

							<div className="grid grid-cols-4 items-center gap-4">
								<Label htmlFor="property" className="text-right">
									Property
								</Label>
								<Select value={property} onValueChange={(value) => setProperty(value as "position" | "rotation" | "scaling" | "color" | "visibility")}>
									<SelectTrigger className="col-span-3">
										<SelectValue />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="position">Position</SelectItem>
										<SelectItem value="rotation">Rotation</SelectItem>
										<SelectItem value="scaling">Scaling</SelectItem>
										<SelectItem value="color">Color</SelectItem>
										<SelectItem value="visibility">Visibility</SelectItem>
									</SelectContent>
								</Select>
							</div>

							<div className="grid grid-cols-4 items-center gap-4">
								<Label htmlFor="component" className="text-right">
									Component
								</Label>
								<Select value={component} onValueChange={(value) => setComponent(value as any)}>
									<SelectTrigger className="col-span-3">
										<SelectValue />
									</SelectTrigger>
									<SelectContent>
										{getAvailableComponents(property).map((comp) => (
											<SelectItem key={comp} value={comp}>
												{comp.toUpperCase()}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
							</div>
						</div>

						<DialogFooter>
							<Button variant="outline" onClick={handleCancel}>
								Cancel
							</Button>
							<Button onClick={handleSubmit}>Add Track</Button>
						</DialogFooter>
					</DialogContent>
				</Dialog>
			);
		};

		// This is a simplified approach - in a real implementation you'd use a proper modal system
		// For now, we'll create a basic animation and return it
		const animation: ISPSParticleAnimation = {
			id: `animation_${Date.now()}`,
			name: "New Animation",
			property: "scaling",
			component: "x",
			enabled: true,
			keyframes: [
				{ time: 0.0, value: 0, easing: "linear" },
				{ time: 1.0, value: 1, easing: "linear" },
			],
			loop: false,
			randomize: false,
			randomRange: 0,
		};

		resolve(animation);
	});
}
